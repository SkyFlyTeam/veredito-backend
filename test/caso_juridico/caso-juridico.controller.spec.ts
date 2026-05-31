import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));

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
    };

    controller = new CasoJuridicoController(
      casoJuridicoService,
      extractionService,
      casoJuridicoCrudService,
      pdfGeneratorService,
      casoJuridicoPipelineOrchestrator,
    );
  });

  it('streamPipeline should call pipeline with filters and map SSE events', async () => {
    const filtros = { tribunais: [1], especies: [2] };
    const pipelineEvent = {
      stage: 'secoes',
      status: 'success',
      timestamp: new Date('2026-05-31T12:00:00.000Z'),
      data: { total: 2 },
    };

    casoJuridicoPipelineOrchestrator.run.mockReturnValue(of(pipelineEvent));

    const events = await collectEvents(
      controller.streamPipeline(10, { filtros }),
    );

    expect(casoJuridicoPipelineOrchestrator.run).toHaveBeenCalledWith(
      10,
      filtros,
    );
    expect(events).toEqual([
      {
        type: 'secoes',
        data: JSON.stringify(pipelineEvent),
        retry: 5000,
      },
    ]);
  });
});
