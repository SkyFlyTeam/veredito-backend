import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));

import { NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';
import { CasoJuridicoPipelineOrchestrator } from '../../src/caso_juridico/pipeline-services/caso_juridico_pipeline_orchestror';
import { CasoJuridicoPipelineStage } from '../../src/caso_juridico/pipeline-services/enums/caso-juridico-pipeline-stage.enum';

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

describe('CasoJuridicoPipelineOrchestrator', () => {
  let orchestrator: CasoJuridicoPipelineOrchestrator;
  let mockCasoJuridicoService: any;
  let mockGenerateCasoSectionsStep: any;
  let mockGenerateCasoPdfStep: any;
  let mockExtractCasoPdfTextStep: any;
  let mockPeticaoPipeline: any;

  beforeEach(() => {
    mockCasoJuridicoService = {
      obterSecoesPeticao: jest.fn(),
    };

    mockGenerateCasoSectionsStep = {
      execute: jest.fn(),
    };

    mockGenerateCasoPdfStep = {
      execute: jest.fn(),
    };

    mockExtractCasoPdfTextStep = {
      execute: jest.fn(),
    };

    mockPeticaoPipeline = {
      runCasoJuridico: jest.fn(),
    };

    orchestrator = new CasoJuridicoPipelineOrchestrator(
      mockCasoJuridicoService,
      mockGenerateCasoSectionsStep,
      mockGenerateCasoPdfStep,
      mockExtractCasoPdfTextStep,
      mockPeticaoPipeline,
    );
  });

  function arrangeSuccessfulPipeline() {
    const secoes = [
      {
        id: 1,
        titulo: 'DOS FATOS',
        conteudo: 'Fatos do caso',
        casoJuridicoId: 10,
      },
      {
        id: 2,
        titulo: 'DOS PEDIDOS',
        conteudo: 'Pedidos do caso',
        casoJuridicoId: 10,
      },
    ];
    const caso = {
      id: 10,
      uf: 'SP',
      area_direito: 'Civil',
      tese_pretendida: 'Indenização por danos morais',
      tribunalPrecedenteId: 7,
    };
    const pdfBuffer = Buffer.from('pdf gerado');
    const rawText = 'texto extraído do pdf gerado';
    const searchEvent = {
      stage: 'search',
      status: 'success',
      timestamp: new Date('2026-05-31T12:00:00.000Z'),
      data: { totalFound: 1 },
    };
    const synthesisEvent = {
      stage: 'synthesis',
      status: 'success',
      timestamp: new Date('2026-05-31T12:00:01.000Z'),
      data: { precedente_id: 99 },
    };
    const ignoredCompleteEvent = {
      stage: 'complete',
      status: 'success',
      timestamp: new Date('2026-05-31T12:00:02.000Z'),
      data: {},
    };

    mockGenerateCasoSectionsStep.execute.mockResolvedValue(secoes);
    mockCasoJuridicoService.obterSecoesPeticao.mockResolvedValue({
      caso,
      secoes,
    });
    mockGenerateCasoPdfStep.execute.mockResolvedValue(pdfBuffer);
    mockExtractCasoPdfTextStep.execute.mockResolvedValue(rawText);
    mockPeticaoPipeline.runCasoJuridico.mockReturnValue(
      of(searchEvent, synthesisEvent, ignoredCompleteEvent),
    );

    return {
      secoes,
      caso,
      pdfBuffer,
      rawText,
      searchEvent,
      synthesisEvent,
    };
  }

  it('run should emit sections and forward search/synthesis using request filters', async () => {
    const { secoes, caso, pdfBuffer, rawText, searchEvent, synthesisEvent } =
      arrangeSuccessfulPipeline();
    const filtros = { tribunais: [1], especies: [2] };

    const events = await collectEvents(orchestrator.run(10, filtros));

    expect(mockGenerateCasoSectionsStep.execute).toHaveBeenCalledWith(10);
    expect(mockCasoJuridicoService.obterSecoesPeticao).toHaveBeenCalledWith(10);
    expect(mockGenerateCasoPdfStep.execute).toHaveBeenCalledWith(secoes, caso);
    expect(mockExtractCasoPdfTextStep.execute).toHaveBeenCalledWith(
      pdfBuffer,
      10,
    );
    expect(mockPeticaoPipeline.runCasoJuridico).toHaveBeenCalledWith(
      rawText,
      filtros,
      true,
    );
    expect(events.map((event) => event.stage)).toEqual([
      CasoJuridicoPipelineStage.SECOES,
      'search',
      'synthesis',
    ]);
    expect(events[0].data).toEqual({ secoes, total: 2 });
    expect(events[1]).toEqual(searchEvent);
    expect(events[2]).toEqual(synthesisEvent);
  });

  it('run should fallback to caso tribunal filter when request filters are missing', async () => {
    const { rawText } = arrangeSuccessfulPipeline();

    await collectEvents(orchestrator.run(10));

    expect(mockPeticaoPipeline.runCasoJuridico).toHaveBeenCalledWith(
      rawText,
      { tribunais: [7] },
      true,
    );
  });

  it('run should emit error event when section generation fails', async () => {
    mockGenerateCasoSectionsStep.execute.mockRejectedValueOnce(
      new NotFoundException('Caso Jurídico com ID 10 não encontrado'),
    );

    const events = await collectEvents(orchestrator.run(10));

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      stage: 'error',
      status: 'error',
      data: {
        failedStage: 'unknown',
        message: 'Caso Jurídico com ID 10 não encontrado',
        errorCode: 'CASO_JURIDICO_PIPELINE_ERROR',
        recoverable: false,
      },
    });
    expect(mockPeticaoPipeline.runCasoJuridico).not.toHaveBeenCalled();
  });
});
