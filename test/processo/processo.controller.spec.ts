import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';

import { ProcessoController } from '../../src/processo/controller/processo.controller';

describe('ProcessoController', () => {
  let controller: ProcessoController;
  let textService: any;
  let processoService: any;

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

    controller = new ProcessoController(textService as any, processoService as any);
  });

  it('searchPeticao should call text service', async () => {
    const file = { originalname: 'p.pdf' } as Express.Multer.File;
    textService.searchPeticaoInicial.mockResolvedValue({ ok: true });

    const res = await controller.searchPeticao(file);

    expect(textService.searchPeticaoInicial).toHaveBeenCalledWith(file);
    expect(res).toEqual({ ok: true });
  });

  it('createProcesso should require file and user', async () => {
    await expect(
      controller.createProcesso(undefined as any, { user: null } as any, {} as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('createProcesso should call service.create', async () => {
    const file = { path: 'uploads/processos/f.pdf' } as Express.Multer.File;
    const req = { user: { id: 7 } } as any;
    const body = { instancia: 1, classe_processual: 'C', area_direito: 'A', tribunal_precedente: 2 } as any;

    processoService.create.mockResolvedValue({ id: 99 });

    const res = await controller.createProcesso(file, req, body);

    expect(processoService.create).toHaveBeenCalledWith({ ...body, file: file.path }, 7);
    expect(res).toMatchObject({ id: 99 });
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
});
