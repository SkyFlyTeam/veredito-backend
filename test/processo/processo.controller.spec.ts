import { describe, expect, it, jest, beforeEach } from '@jest/globals';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import * as fs from 'fs';

jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as any),
  existsSync: jest.fn(),
}));

jest.mock('../../src/processo/service/minuta-sentenca.service', () => ({
  MinutaSentencaService: jest.fn(),
}));

import { ProcessoController } from '../../src/processo/controller/processo.controller';

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

describe('ProcessoController', () => {
  let controller: ProcessoController;
  let textService: any;
  let processoService: any;
  let minutaSentencaService: any;
  let processoPipelineOrchestrator: any;

  beforeEach(() => {
    textService = {
      searchPeticaoInicial: jest.fn(),
    };

    processoService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    minutaSentencaService = {
      gerarMinutaSentenca: jest.fn(),
    };

    processoPipelineOrchestrator = {
      run: jest.fn(),
      replayProcessoAnalysis: jest.fn(),
    };

    controller = new ProcessoController(
      textService as any,
      processoService as any,
      minutaSentencaService as any,
      processoPipelineOrchestrator as any,
    );
  });

  it('createProcesso should require file and user', async () => {
    await expect(
      controller.createProcesso(
        undefined as any,
        { user: null } as any,
        {} as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('createProcesso should call service.create', async () => {
    const file = { path: 'uploads/processos/f.pdf' } as Express.Multer.File;
    const req = { user: { id: 7 } } as any;
    const body = {
      instancia: 1,
      classe_processual: 'C',
      area_direito: 'A',
      tribunal_precedente: 2,
    } as any;

    processoService.create.mockResolvedValue({ id: 99 });

    const res = await controller.createProcesso(file, req, body);

    expect(processoService.create).toHaveBeenCalledWith(
      { ...body, file: file.path },
      7,
    );
    expect(res).toMatchObject({ id: 99 });
  });

  it('streamPipeline should call processo pipeline and map SSE events', async () => {
    const pipelineEvent = {
      stage: 'generalInfo',
      status: 'success',
      timestamp: new Date('2026-05-29T12:00:00.000Z'),
      data: { processo: { id: 12 } },
    };

    processoPipelineOrchestrator.run.mockReturnValue(of(pipelineEvent));
    processoService.findOne.mockResolvedValue({
      id: 12,
      caminhoArquivo: 'uploads/processos/processo-comum.pdf',
    });

    const filtros = { tribunais: [1], especies: [2] };

    const stream = await controller.streamPipeline(12, { filtros });
    const events = await collectEvents(stream);

    expect(processoPipelineOrchestrator.run).toHaveBeenCalledWith(12, filtros);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      type: 'generalInfo',
      data: JSON.stringify(pipelineEvent),
      retry: 5000,
    });
  });

  it('streamPipeline should replay the configured analyzed process for the mock file', async () => {
    const pipelineEvent = {
      stage: 'pecas',
      status: 'success',
      timestamp: new Date('2026-05-29T12:00:00.000Z'),
      data: { pieces: [], totalFound: 0 },
    };

    processoService.findOne.mockResolvedValue({
      id: 12,
      caminhoArquivo: 'uploads/processos/Documento_publico.pdf',
    });
    processoService.getMockedResponseForDocumentoPublico = jest
      .fn()
      .mockResolvedValue({ id: 44 });
    processoPipelineOrchestrator.replayProcessoAnalysis.mockReturnValue(
      of(pipelineEvent),
    );

    const stream = await controller.streamPipeline(12, {});
    const events = await collectEvents(stream);

    expect(
      processoService.getMockedResponseForDocumentoPublico,
    ).toHaveBeenCalled();
    expect(
      processoPipelineOrchestrator.replayProcessoAnalysis,
    ).toHaveBeenCalledWith(44);
    expect(events[0].type).toBe('pecas');
  });

  it('findAll/findOne/delete should proxy to service', async () => {
    processoService.findAll.mockResolvedValue([{ id: 1 }]);
    processoService.findOne.mockResolvedValue({ id: 2 });
    processoService.delete.mockResolvedValue(undefined);

    const all = await controller.findAll();
    expect(all).toEqual([{ id: 1 }]);

    const one = await controller.findOne(2 as any);
    expect(one).toEqual({ id: 2 });

    await controller.deleteProcesso(3 as any);
    expect(processoService.delete).toHaveBeenCalledWith(3);
  });

  it('getPdf should throw if file is missing', async () => {
    processoService.findOne.mockResolvedValue({ id: 1, caminhoArquivo: null });
    await expect(controller.getPdf(1, {} as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getPdf should download file if exists', async () => {
    processoService.findOne.mockResolvedValue({
      id: 1,
      caminhoArquivo: 'uploads/processos/123-456-Documento_publico.pdf',
    });
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const mockRes = { download: jest.fn() };

    await controller.getPdf(1, mockRes as any);

    expect(mockRes.download).toHaveBeenCalledWith(
      expect.any(String),
      'Documento_publico.pdf',
    );
  });
});
