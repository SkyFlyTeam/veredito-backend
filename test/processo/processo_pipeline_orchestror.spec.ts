import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));
import { NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';
import { ProcessoPipelineOrchestrator } from '../../src/processo/pipeline-services/processo_pipeline_orchestror';
import { ProcessoPipelineStage } from '../../src/processo/pipeline-services/enums/processo-pipeline-stage.enum';
import { TipoPecaEnumerator } from '../../src/processo/enumerator/tipo-peca.enumerator';

function collectEvents(observable: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const events: any[] = [];

    observable.subscribe({
      next: (event: any) => events.push(event),
      error: reject,
      complete: () => resolve(events),
    });
  });
}

describe('ProcessoPipelineOrchestrator', () => {
  let orchestrator: ProcessoPipelineOrchestrator;

  let mockPersistence: any;
  let mockExtractProcessDocumentStep: any;
  let mockSearchProcessPiecesStep: any;
  let mockBuildProcessPiecesStep: any;
  let mockExtractProcessGeneralInfoStep: any;
  let mockPeticaoPipeline: any;

  beforeEach(() => {
    mockPersistence = {
      findProcessoOrFail: jest.fn(),
      createProcesso: jest.fn(),
      savePieces: jest.fn(),
      updateGeneralInfo: jest.fn(),
    };

    mockExtractProcessDocumentStep = {
      execute: jest.fn(),
    };

    mockSearchProcessPiecesStep = {
      execute: jest.fn(),
    };

    mockBuildProcessPiecesStep = {
      execute: jest.fn(),
    };

    mockExtractProcessGeneralInfoStep = {
      execute: jest.fn(),
    };

    mockPeticaoPipeline = {
      runProcesso: jest.fn(),
    };

    orchestrator = new ProcessoPipelineOrchestrator(
      mockPersistence,
      mockExtractProcessDocumentStep,
      mockSearchProcessPiecesStep,
      mockBuildProcessPiecesStep,
      mockExtractProcessGeneralInfoStep,
      mockPeticaoPipeline,
    );
  });

  function arrangeSuccessfulPipeline() {
    const processo = {
      id: 7,
      caminho_arquivo: 'uploads/processos/processo.pdf',
    };
    const rawText = 'texto completo do processo';
    const pieces = [
      {
        type: TipoPecaEnumerator.PETICAO_INICIAL,
        name: TipoPecaEnumerator.PETICAO_INICIAL,
        startPage: 1,
        endPage: 4,
        score: 0.95,
        text: 'texto da petição inicial',
      },
      {
        type: TipoPecaEnumerator.CONTESTACAO,
        name: TipoPecaEnumerator.CONTESTACAO,
        startPage: 5,
        endPage: 8,
        score: 0.82,
        text: 'texto da contestação',
      },
    ];
    const processPieces = {
      peticao: 'texto da petição inicial',
      contestacao: 'texto da contestação',
    };
    const information = {
      fatos: 'fatos extraídos',
      pedidos: 'pedidos extraídos',
      fundamentosJuridicos: 'fundamentos extraídos',
    };
    const processoWithPieces = {
      ...processo,
      fatos: information.fatos,
      pedidos: information.pedidos,
      fundamentos: information.fundamentosJuridicos,
      pecas: [{ id: 1, nome: TipoPecaEnumerator.PETICAO_INICIAL }],
    };
    const searchEvent = {
      stage: 'search',
      status: 'success',
      timestamp: new Date('2026-05-29T12:00:00.000Z'),
      data: { totalFound: 1 },
    };
    const synthesisEvent = {
      stage: 'synthesis',
      status: 'success',
      timestamp: new Date('2026-05-29T12:00:01.000Z'),
      data: { precedente_id: 10 },
    };
    const ignoredCompleteEvent = {
      stage: 'complete',
      status: 'success',
      timestamp: new Date('2026-05-29T12:00:02.000Z'),
      data: {},
    };

    mockPersistence.findProcessoOrFail.mockResolvedValue(processo);
    mockExtractProcessDocumentStep.execute.mockResolvedValue(rawText);
    mockSearchProcessPiecesStep.execute.mockResolvedValue(pieces);
    mockBuildProcessPiecesStep.execute.mockReturnValue(processPieces);
    mockExtractProcessGeneralInfoStep.execute.mockResolvedValue(information);
    mockPersistence.updateGeneralInfo.mockResolvedValue(processoWithPieces);
    mockPeticaoPipeline.runProcesso.mockReturnValue(
      of(searchEvent, synthesisEvent, ignoredCompleteEvent),
    );

    return {
      processo,
      rawText,
      pieces,
      processPieces,
      information,
      processoWithPieces,
      searchEvent,
      synthesisEvent,
    };
  }

  it('run should execute process pipeline and forward search/synthesis events', async () => {
    const {
      processo,
      rawText,
      pieces,
      processPieces,
      information,
      processoWithPieces,
      searchEvent,
      synthesisEvent,
    } = arrangeSuccessfulPipeline();

    const filtros = { tribunais: [1], especies: [2] };

    const events = await collectEvents(orchestrator.run(7, filtros));

    expect(mockPersistence.findProcessoOrFail).toHaveBeenCalledWith(7);
    expect(mockExtractProcessDocumentStep.execute).toHaveBeenCalledWith(
      processo.caminho_arquivo,
    );
    expect(mockSearchProcessPiecesStep.execute).toHaveBeenCalledWith(
      processo.caminho_arquivo,
    );
    expect(mockPersistence.savePieces).toHaveBeenCalledWith(processo, pieces);
    expect(mockBuildProcessPiecesStep.execute).toHaveBeenCalledWith(pieces);
    expect(mockExtractProcessGeneralInfoStep.execute).toHaveBeenCalledWith(
      processPieces,
    );
    expect(mockPersistence.updateGeneralInfo).toHaveBeenCalledWith(
      processo,
      information,
    );
    expect(mockPeticaoPipeline.runProcesso).toHaveBeenCalledWith(
      rawText,
      filtros,
      true,
    );

    expect(events.map((event) => event.stage)).toEqual([
      ProcessoPipelineStage.GENERAL_INFO,
      ProcessoPipelineStage.PECAS,
      'search',
      'synthesis',
    ]);
    expect(events[0].data).toEqual({
      information,
      processo: processoWithPieces,
    });
    expect(events[1].data).toEqual({
      pieces,
      totalFound: 2,
    });
    expect(events[2]).toEqual(searchEvent);
    expect(events[3]).toEqual(synthesisEvent);
  });

  it('runFromFile should create processo before executing pipeline', async () => {
    const { processo } = arrangeSuccessfulPipeline();
    mockPersistence.findProcessoOrFail.mockReset();
    mockPersistence.createProcesso.mockResolvedValue(processo);

    await collectEvents(
      orchestrator.runFromFile({
        filePath: 'uploads/processos/processo.pdf',
        createData: {
          instancia: 1,
          classe_processual: 'Mandado de Segurança',
          area_direito: 'Tributário',
          tribunal_precedente: 3,
        },
        usuarioId: 99,
      }),
    );

    expect(mockPersistence.createProcesso).toHaveBeenCalledWith(
      'uploads/processos/processo.pdf',
      {
        instancia: 1,
        classe_processual: 'Mandado de Segurança',
        area_direito: 'Tributário',
        tribunal_precedente: 3,
      },
      99,
    );
  });

  it('run should emit error event when processo is not found', async () => {
    mockPersistence.findProcessoOrFail.mockRejectedValueOnce(
      new NotFoundException('Processo com ID 7 não encontrado'),
    );

    const events = await collectEvents(orchestrator.run(7));

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      stage: 'error',
      status: 'error',
      data: {
        failedStage: 'unknown',
        message: 'Processo com ID 7 não encontrado',
        errorCode: 'PROCESSO_PIPELINE_ERROR',
        recoverable: false,
      },
    });
    expect(mockExtractProcessDocumentStep.execute).not.toHaveBeenCalled();
  });
});
