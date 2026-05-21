import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

jest.mock('node:fs/promises', () => ({
  unlink: jest.fn(),
}));

import { ProcessoService } from '../../src/processo/service/processo.service';
import ProcessoJuridicoEntity from '../../src/processo/entity/processo_juridico.entity';
import { CreateProcessoDTO } from '../../src/processo/dtos/processo.dto';
import * as fs from 'node:fs/promises';

describe('ProcessoService', () => {
  let repo: any;
  let service: ProcessoService;
  const uploadsRoot = (ProcessoService as any).UPLOADS_ROOT as string;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    service = new ProcessoService(repo as any);
  });

  it('findAll() should map entities to DTOs', async () => {
    const ent: ProcessoJuridicoEntity = {
      id: 1,
      caminho_arquivo: `${uploadsRoot}f.pdf`,
      instancia: 2,
      classe_processual: 'Classe',
      area_direito: 'Direito',
      created_at: new Date(),
      peticao: { id: 5 } as any,
      tribunal_precedente: { id: 7 } as any,
    } as unknown as ProcessoJuridicoEntity;

    repo.find.mockResolvedValue([ent]);

    const res = await service.findAll();

    expect(repo.find).toHaveBeenCalled();
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ id: 1, peticaoId: 5, tribunalPrecedenteId: 7 });
  });

  it('findOne() should throw when not found', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(service.findOne(123)).rejects.toThrow(NotFoundException);
  });

  it('create() should validate required fields and save', async () => {
    const dto: Partial<CreateProcessoDTO> & { file: string } = {
      instancia: 1,
      classe_processual: 'X',
      area_direito: 'Y',
      tribunal_precedente: 2,
      file: `${uploadsRoot}uploaded.pdf`,
    };

    const created = {} as ProcessoJuridicoEntity;
    repo.create.mockReturnValue(created);
    repo.save.mockImplementation(async (p: any) => ({ ...p, id: 42 }));
    repo.findOne.mockResolvedValue({
      id: 42,
      caminho_arquivo: dto.file,
      instancia: dto.instancia,
      classe_processual: dto.classe_processual,
      area_direito: dto.area_direito,
      created_at: new Date(),
      peticao: null,
      tribunal_precedente: { id: dto.tribunal_precedente },
    });

    const result = await service.create(dto, 9);

    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 42, peticaoId: null, tribunalPrecedenteId: 2 });
  });

  it('delete() should remove entity and unlink file', async () => {
    const processo = {
      id: 10,
      caminho_arquivo: `${uploadsRoot}to-delete.pdf`,
    } as unknown as ProcessoJuridicoEntity;

    repo.findOne.mockResolvedValue(processo);
    repo.delete.mockResolvedValue({ affected: 1 });
    await service.delete(10);

    expect(repo.delete).toHaveBeenCalledWith(10);
    expect(fs.unlink).toHaveBeenCalled();
  });
});
