import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FiltrosDto } from '../../peticao/dto/filtros.dto';
import { PipelineEvent } from '../../peticao/dto/pipeline-event.dto';
import { PipelinePrecedentMatch } from '../../peticao/pipeline-services/types/pipeline-types';
import { PipelineOrchestrator } from '../../peticao/pipeline-services/pipeline_orchestror';
import { CasoPrecedenteSugeridoEntity } from '../entity/caso_precedente_sugerido.entity';
import { CasoJuridicoService } from '../service/caso-juridico.service';
import { CasoJuridicoPipelineStage } from './enums/caso-juridico-pipeline-stage.enum';
import { ExtractCasoPdfTextStep } from './steps/extract-caso-pdf-text.step';
import { GenerateCasoPdfStep } from './steps/generate-caso-pdf.step';
import { GenerateCasoSectionsStep } from './steps/generate-caso-sections.step';
import {
  CasoJuridicoPipelineEvent,
  CasoJuridicoSecoesEvent,
} from './types/caso-juridico-pipeline-event.type';

@Injectable()
export class CasoJuridicoPipelineOrchestrator {
  private readonly logger = new Logger(CasoJuridicoPipelineOrchestrator.name);

  constructor(
    private readonly casoJuridicoService: CasoJuridicoService,
    private readonly generateCasoSectionsStep: GenerateCasoSectionsStep,
    private readonly generateCasoPdfStep: GenerateCasoPdfStep,
    private readonly extractCasoPdfTextStep: ExtractCasoPdfTextStep,
    private readonly peticaoPipeline: PipelineOrchestrator,
  ) {}

  run(
    casoId: number,
    filtros?: FiltrosDto,
  ): Observable<CasoJuridicoPipelineEvent> {
    return new Observable<CasoJuridicoPipelineEvent>((observer) => {
      const pipelineStart = Date.now();

      const emitError = (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';

        this.logger.error(
          `[CASO JURIDICO PIPELINE] ${message}`,
          error instanceof Error ? error.stack : undefined,
        );

        observer.next({
          stage: 'error',
          status: 'error',
          timestamp: new Date(),
          duration: Date.now() - pipelineStart,
          data: {
            failedStage: 'unknown',
            message,
            errorCode: 'CASO_JURIDICO_PIPELINE_ERROR',
            recoverable: false,
            suggestedAction: 'Verifique os logs do backend.',
          },
        });
      };

      const execute = async () => {
        try {
          this.logger.log(`[CASO JURIDICO PIPELINE] Iniciando caso ${casoId}`);

          const secoes = await this.generateCasoSectionsStep.execute(casoId);

          observer.next({
            stage: CasoJuridicoPipelineStage.SECOES,
            status: 'success',
            timestamp: new Date(),
            duration: Date.now() - pipelineStart,
            data: {
              secoes,
              total: secoes.length,
            },
          } as CasoJuridicoSecoesEvent);

          const { caso } =
            await this.casoJuridicoService.obterSecoesPeticao(casoId);
          const pdfBuffer = await this.generateCasoPdfStep.execute(
            secoes,
            caso,
          );
          const rawText = await this.extractCasoPdfTextStep.execute(
            pdfBuffer,
            casoId,
          );
          const filtrosAplicados =
            filtros ?? this.buildFiltros(caso.tribunalPrecedenteId);

          await this.forwardPeticaoAnalysis(
            rawText,
            filtrosAplicados,
            observer,
          );
          observer.complete();
        } catch (error) {
          emitError(error);
          observer.complete();
        }
      };

      void execute();

      return () => {
        this.logger.log(
          '[CASO JURIDICO PIPELINE] Cliente desconectou do stream',
        );
      };
    });
  }

  replayCasoJuridicoAnalysis(
    casoId: number,
  ): Observable<CasoJuridicoPipelineEvent> {
    return new Observable<CasoJuridicoPipelineEvent>((observer) => {
      const pipelineStart = Date.now();

      const execute = async () => {
        try {
          this.logger.log(
            `[CASO JURIDICO PIPELINE] Reproduzindo análise do caso ${casoId}`,
          );

          const { secoes, precedentesSugeridos } =
            await this.casoJuridicoService.findCasoJuridicoAnalysisOrFail(
              casoId,
            );

          await new Promise((resolve) => setTimeout(resolve, 2000));

          observer.next({
            stage: CasoJuridicoPipelineStage.SECOES,
            status: 'success',
            timestamp: new Date(),
            duration: Date.now() - pipelineStart,
            data: {
              secoes,
              total: secoes.length,
            },
          } as CasoJuridicoSecoesEvent);

          await new Promise((resolve) => setTimeout(resolve, 1000));

          await this.forwardCasoPrecedentesReplay(
            precedentesSugeridos,
            observer,
          );

          observer.complete();
        } catch (error) {
          this.emitError(error, pipelineStart, observer);
          observer.complete();
        }
      };

      void execute();

      return () => {
        this.logger.log(
          '[CASO JURIDICO PIPELINE] Cliente desconectou do replay do stream',
        );
      };
    });
  }

  private buildFiltros(
    tribunalPrecedenteId?: number | null,
  ): FiltrosDto | undefined {
    if (!tribunalPrecedenteId) {
      return undefined;
    }

    return { tribunais: [tribunalPrecedenteId] };
  }

  private forwardPeticaoAnalysis(
    rawText: string,
    filtros: FiltrosDto | undefined,
    observer: { next: (event: CasoJuridicoPipelineEvent) => void },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.peticaoPipeline.runCasoJuridico(rawText, filtros, true).subscribe({
        next: (event: PipelineEvent) => {
          if (event.stage === 'search' || event.stage === 'synthesis') {
            observer.next(event);
          }
        },
        error: reject,
        complete: resolve,
      });
    });
  }

  private async forwardCasoPrecedentesReplay(
    suggestions: CasoPrecedenteSugeridoEntity[],
    observer: { next: (event: CasoJuridicoPipelineEvent) => void },
  ): Promise<void> {
    const searchStart = Date.now();
    const precedents = this.toReplayPrecedents(suggestions);

    observer.next({
      stage: 'search',
      status: 'success',
      timestamp: new Date(),
      duration: Date.now() - searchStart,
      data: {
        precedents,
        totalFound: precedents.length,
        averageSimilarityScore: this.getAverageSimilarityScore(precedents),
      },
    } as PipelineEvent);

    for (const suggestion of suggestions) {
      const synthesisStart = Date.now();

      observer.next({
        stage: 'synthesis',
        status: 'success',
        timestamp: new Date(),
        duration: Date.now() - synthesisStart,
        data: this.toReplayCasoPrecedente(suggestion),
      } as PipelineEvent);

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private toReplayPrecedents(
    suggestions: CasoPrecedenteSugeridoEntity[],
  ): PipelinePrecedentMatch[] {
    const precedents = new Map<number, PipelinePrecedentMatch>();

    for (const suggestion of suggestions) {
      const precedent = suggestion.precedente;
      if (!precedent || precedents.has(precedent.id)) {
        continue;
      }

      precedents.set(precedent.id, {
        id: precedent.id,
        numero_registro: precedent.numero_registro,
        tese: precedent.tese,
        questao: precedent.questao,
        ultima_atualizacao: precedent.ultima_atualizacao,
        status_id: precedent.status?.id,
        tribunal_id: precedent.tribunal?.id,
        especie_id: precedent.especie?.id,
        status_nome: precedent.status?.nome,
        tribunal_nome: precedent.tribunal?.nome,
        tribunal_sigla: precedent.tribunal?.sigla,
        especie_nome: precedent.especie?.nome,
        especie_sigla: precedent.especie?.sigla,
      });
    }

    return [...precedents.values()];
  }

  private getAverageSimilarityScore(
    precedents: PipelinePrecedentMatch[],
  ): number {
    const scores = precedents
      .map((precedent) => Number(precedent.score))
      .filter((score) => Number.isFinite(score));

    if (scores.length === 0) {
      return 0;
    }

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private toReplayCasoPrecedente(
    suggestion: CasoPrecedenteSugeridoEntity,
  ) {
    return {
      id: suggestion.id,
      casoJuridicoId: suggestion.casoJuridicoId,
      precedenteId: suggestion.precedenteId,
      caso_juridico_id: suggestion.casoJuridicoId,
      precedente_id: suggestion.precedenteId,
      casoJuridico: { id: suggestion.casoJuridicoId },
      precedente: suggestion.precedente,
    };
  }

  private emitError(
    error: unknown,
    pipelineStart: number,
    observer: { next: (event: CasoJuridicoPipelineEvent) => void },
  ): void {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido';

    this.logger.error(
      `[CASO JURIDICO PIPELINE] ${message}`,
      error instanceof Error ? error.stack : undefined,
    );

    observer.next({
      stage: 'error',
      status: 'error',
      timestamp: new Date(),
      duration: Date.now() - pipelineStart,
      data: {
        failedStage: 'unknown',
        message,
        errorCode: 'CASO_JURIDICO_PIPELINE_ERROR',
        recoverable: false,
        suggestedAction: 'Verifique os logs do backend.',
      },
    } as PipelineEvent);
  }
}
