import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FiltrosDto } from '../../peticao/dto/filtros.dto';
import { PipelineEvent } from '../../peticao/dto/pipeline-event.dto';
import { PipelineOrchestrator } from '../../peticao/pipeline-services/pipeline_orchestror';
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
}
