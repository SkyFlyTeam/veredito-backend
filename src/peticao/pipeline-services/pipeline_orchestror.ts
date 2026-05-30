/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClassificacaoAderencia } from '../../precedents/enumerator/classificacao-aderencia.enumerator';
import {
  CompleteEvent,
  ErrorEvent,
  PipelineEvent,
  ResumoEvent,
  SearchEvent,
  SynthesisEvent,
} from '../dto/pipeline-event.dto';
import { FiltrosDto } from '../dto/filtros.dto';
import { PipelineFlow } from './enums/pipeline-flow.enum';
import { PipelinePersistenceService } from './service/pipeline-persistence.service';
import {
  PipelineInput,
  PipelinePrecedentMatch,
  PipelineSynthesisResult,
} from './types/pipeline-types';
import { BuildSummaryTextStep } from './steps/build-summary-text.step';
import { ExtractFileTextStep } from './steps/extract-file-text.step';
import { GenerateEmbeddingStep } from './steps/generate-embedding.step';
import { GenerateSummaryStep } from './steps/generate-summary.step';
import { GenerateSynthesisStep } from './steps/generate-synthesis.step';
import { SearchPrecedentsStep } from './steps/search-precedents.step';

@Injectable()
export class PipelineOrchestrator {
  private readonly logger = new Logger(PipelineOrchestrator.name);

  constructor(
    private readonly persistence: PipelinePersistenceService,
    private readonly extractFileTextStep: ExtractFileTextStep,
    private readonly generateSummaryStep: GenerateSummaryStep,
    private readonly buildSummaryTextStep: BuildSummaryTextStep,
    private readonly generateEmbeddingStep: GenerateEmbeddingStep,
    private readonly searchPrecedentsStep: SearchPrecedentsStep,
    private readonly generateSynthesisStep: GenerateSynthesisStep,
  ) {}

  run(peticaoId: number, filtros?: FiltrosDto): Observable<PipelineEvent> {
    return this.runPeticao(peticaoId, filtros);
  }

  runPeticao(
    peticaoId: number,
    filtros?: FiltrosDto,
  ): Observable<PipelineEvent> {
    return this.stream(PipelineFlow.PETICAO, async () => {
      const peticao = await this.persistence.findPeticaoOrFail(peticaoId);
      const rawText = await this.extractFileTextStep.execute(
        peticao.caminhoArquivo,
      );

      return {
        rawText,
        filtros,
        peticaoId: peticao.id,
      };
    });
  }

  runProcesso(
    rawText: string,
    filtros?: FiltrosDto,
    emitSearch = false,
  ): Observable<PipelineEvent> {
    return this.stream(
      PipelineFlow.PROCESSO,
      async () => ({
        rawText,
        filtros,
      }),
      { emitSearch },
    );
  }

  runCasoJuridico(
    rawText: string,
    filtros?: FiltrosDto,
  ): Observable<PipelineEvent> {
    return this.stream(PipelineFlow.CASO_JURIDICO, async () => ({
      rawText,
      filtros,
    }));
  }

  private stream(
    flow: PipelineFlow,
    resolveInput: () => Promise<PipelineInput>,
    options: { emitSearch?: boolean } = {},
  ): Observable<PipelineEvent> {
    return new Observable<PipelineEvent>((observer) => {
      const pipelineStart = Date.now();

      this.logger.log(`[PIPELINE SSE] Iniciando stream ${flow}`);

      const emitError = (
        failedStage: ErrorEvent['data']['failedStage'],
        error: unknown,
        precedentId?: number,
        recoverable = false,
      ) => {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';

        this.logger.error(
          `[PIPELINE SSE][${flow}][${failedStage}] ${message}`,
          error instanceof Error ? error.stack : undefined,
        );

        observer.next({
          stage: 'error',
          status: 'error',
          timestamp: new Date(),
          duration: Date.now() - pipelineStart,
          data: {
            failedStage,
            message,
            errorCode: 'PIPELINE_STREAM_ERROR',
            precedentId,
            recoverable,
            suggestedAction: recoverable
              ? 'Continue processando os demais precedentes.'
              : 'Verifique os logs do backend.',
          },
        });
      };

      const execute = async () => {
        let precedentsProcessed = 0;
        let synthesisGenerated = 0;

        try {
          const input = await resolveInput();
          this.assertRawText(input.rawText);

          const summary = await this.generateSummaryStep.execute(input.rawText);
          const resume = this.generateSummaryStep.format(summary);
          const sourceText = this.buildSummaryTextStep.fromSummary(summary);

          if (flow === PipelineFlow.PETICAO) {
            observer.next(this.createResumoEvent(resume, pipelineStart));
          }

          const embedding =
            await this.generateEmbeddingStep.execute(sourceText);

          if (flow === PipelineFlow.PETICAO && input.peticaoId) {
            const peticao = await this.persistence.findPeticaoOrFail(
              input.peticaoId,
            );
            await this.persistence.savePeticaoAnalysis(
              peticao,
              resume,
              embedding,
            );
          }

          const searchStart = Date.now();
          const precedents = await this.searchPrecedentsStep.execute(
            embedding,
            input.filtros,
          );

          precedentsProcessed = precedents.length;

          if (flow === PipelineFlow.PETICAO && input.peticaoId) {
            await this.persistence.saveInitialSuggestions(
              input.peticaoId,
              precedents,
            );
          }

          if (flow === PipelineFlow.PETICAO || options.emitSearch) {
            observer.next(this.createSearchEvent(precedents, searchStart));
          }

          for (const [index, precedent] of precedents.entries()) {
            const synthesisStart = Date.now();

            try {
              const synthesis = await this.generateSynthesisStep.execute(
                sourceText,
                precedent,
                input.peticaoId,
              );

              if (!this.shouldEmitSynthesis(flow, synthesis)) {
                continue;
              }

              const data =
                flow === PipelineFlow.PETICAO
                  ? await this.persistence.saveSynthesis(synthesis)
                  : synthesis;

              synthesisGenerated++;

              observer.next({
                stage: 'synthesis',
                status: 'success',
                timestamp: new Date(),
                duration: Date.now() - synthesisStart,
                data,
              } as SynthesisEvent);
            } catch (error) {
              emitError('synthesis', error, precedent.id, true);
            }

            this.logger.log(
              `[PIPELINE SSE][${flow}] Precedente ${index + 1}/${precedents.length} processado`,
            );
          }

          observer.next(
            this.createCompleteEvent(
              pipelineStart,
              precedentsProcessed,
              synthesisGenerated,
            ),
          );
          observer.complete();
        } catch (error) {
          emitError('unknown', error, undefined, false);
          observer.complete();
        }
      };

      void execute();

      return () => {
        this.logger.log(`[PIPELINE SSE] Cliente desconectou do stream ${flow}`);
      };
    });
  }

  private assertRawText(rawText: string): void {
    if (!rawText?.trim()) {
      throw new Error('Texto de entrada da pipeline não informado.');
    }
  }

  private shouldEmitSynthesis(
    flow: PipelineFlow,
    synthesis: PipelineSynthesisResult,
  ): boolean {
    return (
      flow !== PipelineFlow.CASO_JURIDICO ||
      synthesis.classificacao === ClassificacaoAderencia.APLICAVEL
    );
  }

  private createResumoEvent(
    resumo: string,
    pipelineStart: number,
  ): ResumoEvent {
    return {
      stage: 'resumo',
      status: 'success',
      timestamp: new Date(),
      duration: Date.now() - pipelineStart,
      data: { resumo },
    };
  }

  private createSearchEvent(
    precedents: PipelinePrecedentMatch[],
    searchStart: number,
  ): SearchEvent {
    return {
      stage: 'search',
      status: 'success',
      timestamp: new Date(),
      duration: Date.now() - searchStart,
      data: {
        precedents,
        totalFound: precedents.length,
        averageSimilarityScore:
          this.searchPrecedentsStep.getAverageSimilarityScore(precedents),
      },
    };
  }

  private createCompleteEvent(
    pipelineStart: number,
    precedentsProcessed: number,
    synthesisGenerated: number,
  ): CompleteEvent {
    const totalDurationMs = Date.now() - pipelineStart;

    return {
      stage: 'complete',
      status: 'success',
      timestamp: new Date(),
      duration: totalDurationMs,
      data: {
        totalDurationMs,
        precedentsProcessed,
        synthesisGenerated,
      },
    };
  }
}
