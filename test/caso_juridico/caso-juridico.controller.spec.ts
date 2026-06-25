import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));
jest.mock('pdfkit', () => jest.fn(), { virtual: true });

import { of } from 'rxjs';
import { CasoJuridicoController } from '../../src/caso_juridico/controller/caso-juridico.controller';

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

describe('CasoJuridicoController', () => {
  let controller: CasoJuridicoController;
  let casoJuridicoService: any;
  let extractionService: any;
  let casoJuridicoCrudService: any;
  let pdfGeneratorService: any;
  let casoJuridicoPipelineOrchestrator: any;

  beforeEach(() => {
    casoJuridicoService = {
      gerarPeticaoInicial: jest.fn(),
      obterSecoesPeticao: jest.fn(),
      getMockedResponseForCasoJuridico: jest.fn(),
    };

    extractionService = {
      extractFromDocuments: jest.fn(),
    };

    casoJuridicoCrudService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    pdfGeneratorService = {
      gerarPeticaoPdf: jest.fn(),
    };

    casoJuridicoPipelineOrchestrator = {
      run: jest.fn(),
      replayCasoJuridicoAnalysis: jest.fn(),
    };

    controller = new CasoJuridicoController(
      casoJuridicoService,
      extractionService,
      casoJuridicoCrudService,
      pdfGeneratorService,
      casoJuridicoPipelineOrchestrator,
    );
  });

  it('streamPipeline should replay configured caso and map SSE events', async () => {
    const filtros = { tribunais: [1], especies: [2] };
    const pipelineEvent = {
      stage: 'secoes',
      status: 'success',
      timestamp: new Date('2026-05-31T12:00:00.000Z'),
      data: { total: 2 },
    };

    casoJuridicoService.getMockedResponseForCasoJuridico.mockResolvedValue({
      id: 99,
    });
    casoJuridicoPipelineOrchestrator.replayCasoJuridicoAnalysis.mockReturnValue(
      of(pipelineEvent),
    );

    const stream = await controller.streamPipeline(10, { filtros });
    const events = await collectEvents(stream);

    expect(
      casoJuridicoService.getMockedResponseForCasoJuridico,
    ).toHaveBeenCalledTimes(1);
    expect(
      casoJuridicoPipelineOrchestrator.replayCasoJuridicoAnalysis,
    ).toHaveBeenCalledWith(99);
    expect(casoJuridicoPipelineOrchestrator.run).not.toHaveBeenCalled();
    expect(events).toEqual([
      {
        type: 'secoes',
        data: JSON.stringify(pipelineEvent),
        retry: 5000,
      },
    ]);
  });

  it('streamPipeline should pass replay errors to SSE mapping', async () => {
    const errorEvent = {
      stage: 'error',
      status: 'error',
      timestamp: new Date('2026-05-31T12:00:00.000Z'),
      data: {
        failedStage: 'unknown',
        message: 'MOCKED_CASO_JURIDICO_ID inválido',
      },
    };

    casoJuridicoService.getMockedResponseForCasoJuridico.mockResolvedValue({
      id: 99,
    });
    casoJuridicoPipelineOrchestrator.replayCasoJuridicoAnalysis.mockReturnValue(
      of(errorEvent),
    );

    const stream = await controller.streamPipeline(10, {});
    const events = await collectEvents(stream);

    expect(events).toEqual([
      {
        type: 'error',
        data: JSON.stringify(errorEvent),
        retry: 5000,
      },
    ]);
  });
});
