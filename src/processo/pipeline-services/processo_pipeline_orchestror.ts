import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PipelineEvent } from '../../peticao/dto/pipeline-event.dto';
import { FiltrosDto } from '../../peticao/dto/filtros.dto';
import ProcessoJuridicoEntity from '../entity/processo_juridico.entity';
import { PipelineOrchestrator } from '../../peticao/pipeline-services/pipeline_orchestror';
import { ProcessoPipelineStage } from './enums/processo-pipeline-stage.enum';
import { ProcessoPipelinePersistenceService } from './service/processo-pipeline-persistence.service';
import {
  ProcessoGeneralInfoEvent,
  ProcessoPecasEvent,
  ProcessoPipelineEvent,
} from './types/processo-pipeline-event.type';
import { ProcessoPipelineFileInput } from './types/processo-pipeline-input.type';
import { BuildProcessPiecesStep } from './steps/build-process-pieces.step';
import { ExtractProcessDocumentStep } from './steps/extract-process-document.step';
import { ExtractProcessGeneralInfoStep } from './steps/extract-process-general-info.step';
import { SearchProcessPiecesStep } from './steps/search-process-pieces.step';
import { TipoPecaEnumerator } from '../enumerator/tipo-peca.enumerator';

@Injectable()
export class ProcessoPipelineOrchestrator {
  private readonly logger = new Logger(ProcessoPipelineOrchestrator.name);

  constructor(
    private readonly persistence: ProcessoPipelinePersistenceService,
    private readonly extractProcessDocumentStep: ExtractProcessDocumentStep,
    private readonly searchProcessPiecesStep: SearchProcessPiecesStep,
    private readonly buildProcessPiecesStep: BuildProcessPiecesStep,
    private readonly extractProcessGeneralInfoStep: ExtractProcessGeneralInfoStep,
    private readonly peticaoPipeline: PipelineOrchestrator,
  ) {}

  run(
    processoId: number,
    filtros?: FiltrosDto,
  ): Observable<ProcessoPipelineEvent> {
    return this.stream(
      async () => this.persistence.findProcessoOrFail(processoId),
      filtros,
    );
  }

  replayProcessoAnalysis(
    processoId: number,
  ): Observable<ProcessoPipelineEvent> {
    return new Observable<ProcessoPipelineEvent>((observer) => {
      const pipelineStart = Date.now();

      const execute = async () => {
        try {
          const processo =
            await this.persistence.findProcessoWithPieces(processoId);

          const information = {
            fatos: processo.fatos,
            pedidos: processo.pedidos,
            fundamentosJuridicos: processo.fundamentos,
          };
          const pieces = [...(processo.pecas ?? [])]
            .sort((left, right) => left.pagina_inicial - right.pagina_inicial)
            .map((piece, index, allPieces) => ({
              type: piece.tipo_peca.nome as TipoPecaEnumerator,
              name: piece.nome,
              startPage: piece.pagina_inicial,
              endPage: allPieces[index + 1]
                ? allPieces[index + 1].pagina_inicial - 1
                : undefined,
              score: undefined,
              text: '',
            }));

          observer.next({
            stage: ProcessoPipelineStage.GENERAL_INFO,
            status: 'success',
            timestamp: new Date(),
            duration: Date.now() - pipelineStart,
            data: { information, processo },
          } as ProcessoGeneralInfoEvent);

          observer.next({
            stage: ProcessoPipelineStage.PECAS,
            status: 'success',
            timestamp: new Date(),
            duration: Date.now() - pipelineStart,
            data: {
              pieces,
              totalFound: pieces.length,
            },
          } as ProcessoPecasEvent);

          const rawText = await this.extractProcessDocumentStep.execute(
            processo.caminho_arquivo,
          );

          await this.forwardPeticaoAnalysis(rawText, observer);
          observer.complete();
        } catch (error) {
          this.emitReplayError(error, pipelineStart, observer);
          observer.complete();
        }
      };

      void execute();

      return () => {
        this.logger.log(
          '[PROCESSO PIPELINE] Cliente desconectou do replay do stream',
        );
      };
    });
  }

  runFromFile(
    input: ProcessoPipelineFileInput,
  ): Observable<ProcessoPipelineEvent> {
    return this.stream(async () =>
      this.persistence.createProcesso(
        input.filePath,
        input.createData,
        input.usuarioId,
      ),
    );
  }

  private stream(
    resolveProcesso: () => Promise<ProcessoJuridicoEntity>,
    filtros?: FiltrosDto,
  ) {
    return new Observable<ProcessoPipelineEvent>((observer) => {
      const pipelineStart = Date.now();

      const emitError = (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';

        this.logger.error(
          `[PROCESSO PIPELINE] ${message}`,
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
            errorCode: 'PROCESSO_PIPELINE_ERROR',
            recoverable: false,
            suggestedAction: 'Verifique os logs do backend.',
          },
        });
      };

      const execute = async () => {
        try {
          const processo = await resolveProcesso();

          this.logger.log(
            `[PROCESSO PIPELINE] Iniciando análise do processo ${processo.id}`,
          );

          const rawText = await this.extractProcessDocumentStep.execute(
            processo.caminho_arquivo,
          );

          const pieces = await this.searchProcessPiecesStep.execute(
            processo.caminho_arquivo,
          );

          await this.persistence.savePieces(processo, pieces);

          const processPieces = this.buildProcessPiecesStep.execute(pieces);
          const information =
            await this.extractProcessGeneralInfoStep.execute(processPieces);
          const processoWithPieces = await this.persistence.updateGeneralInfo(
            processo,
            information,
          );

          observer.next({
            stage: ProcessoPipelineStage.GENERAL_INFO,
            status: 'success',
            timestamp: new Date(),
            duration: Date.now() - pipelineStart,
            data: {
              information,
              processo: processoWithPieces,
            },
          } as ProcessoGeneralInfoEvent);

          observer.next({
            stage: ProcessoPipelineStage.PECAS,
            status: 'success',
            timestamp: new Date(),
            duration: Date.now() - pipelineStart,
            data: {
              pieces,
              totalFound: pieces.length,
            },
          } as ProcessoPecasEvent);

          await this.forwardPeticaoAnalysis(rawText, observer, filtros);
          observer.complete();
        } catch (error) {
          emitError(error);
          observer.complete();
        }
      };

      void execute();

      return () => {
        this.logger.log('[PROCESSO PIPELINE] Cliente desconectou do stream');
      };
    });
  }

  private forwardPeticaoAnalysis(
    rawText: string,
    observer: { next: (event: ProcessoPipelineEvent) => void },
    filtros?: FiltrosDto,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.peticaoPipeline.runProcesso(rawText, filtros, true).subscribe({
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

  private forwardPeticaoReplay(
    peticaoId: number,
    observer: { next: (event: ProcessoPipelineEvent) => void },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.peticaoPipeline.replayPeticaoAnalysis(peticaoId).subscribe({
        next: (event: PipelineEvent) => {
          if (event.stage === 'search' || event.stage === 'synthesis') {
            observer.next(event);
          } else if (event.stage === 'error') {
            reject(new Error(event.data.message));
          }
        },
        error: reject,
        complete: resolve,
      });
    });
  }

  private emitReplayError(
    error: unknown,
    pipelineStart: number,
    observer: { next: (event: ProcessoPipelineEvent) => void },
  ): void {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido';

    this.logger.error(
      `[PROCESSO PIPELINE REPLAY] ${message}`,
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
        errorCode: 'PROCESSO_PIPELINE_ERROR',
        recoverable: false,
        suggestedAction: 'Verifique os logs do backend.',
      },
    });
  }
}
