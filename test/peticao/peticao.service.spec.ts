import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PeticaoService } from '../../src/peticao/service/peticao.service';
import { PeticaoEntity } from '../../src/peticao/entity/peticao.entity';
import { NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs/promises';

jest.mock('../../src/peticao/pipeline-services/word_processing/text-processing.service', () => ({
  TextProcessingService: class TextProcessingService {},
}));

jest.mock('node:fs/promises', () => ({
  unlink: jest.fn(() => Promise.resolve()),
}));

const makePeticao = (): PeticaoEntity => ({
  id: 1,
  caminhoArquivo: 'path/to/file.pdf',
  resumo: 'Resumo da petição',
  teseVetor: [],
  questaoVetor: [],
  createdAt: new Date(),
  usuarioId: 1,
  user: null as any,
  precedenteSugerido: [],
});

const createPeticaoRepositoryMock = () => ({
  find: jest.fn((_conditions?: any): Promise<PeticaoEntity[]> => Promise.resolve([])),
  findOne: jest.fn((_conditions?: any): Promise<PeticaoEntity | null> => Promise.resolve(null)),
  create: jest.fn((_data: any): PeticaoEntity => null as any),
  save: jest.fn((_entity: any): Promise<PeticaoEntity> => Promise.resolve(null as any)),
  delete: jest.fn((_ids?: any) => Promise.resolve({ affected: 0 })),
});

describe('PeticaoService', () => {
  let service: PeticaoService;
  let repository: ReturnType<typeof createPeticaoRepositoryMock>;
  let mockTextProcessingService: any;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = createPeticaoRepositoryMock();
    mockTextProcessingService = { process: jest.fn() };
    service = new PeticaoService(repository as any, mockTextProcessingService);
  });

  describe('findAll', () => {
    it('should return an array of petitions', async () => {
      const peticao = makePeticao();
      repository.find.mockResolvedValueOnce([peticao]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(peticao.id);
    });

    it('should return an empty array if no petitions found', async () => {
      repository.find.mockResolvedValueOnce([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single petition', async () => {
      const peticao = makePeticao();
      repository.findOne.mockResolvedValueOnce(peticao);

      const result = await service.findOne(1);
      expect(result.id).toBe(peticao.id);
    });

    it('should throw NotFoundException if petition not found', async () => {
      repository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return a petition with null resumo', async () => {
       const peticao = makePeticao();
       peticao.resumo = null;
       repository.findOne.mockResolvedValueOnce(peticao);

       const result = await service.findOne(1);
       expect(result.resumo).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new petition and return its DTO', async () => {
      const filePath = 'path/to/file.pdf';
      const usuarioId = 1;
      const peticao = makePeticao();

      repository.create.mockReturnValueOnce(peticao);
      repository.save.mockResolvedValueOnce(peticao);

      const result = await service.create(filePath, usuarioId);

      expect(repository.create).toHaveBeenCalledWith({
        caminhoArquivo: filePath,
        usuarioId,
      });
      expect(repository.save).toHaveBeenCalledWith(peticao);
      expect(result).toEqual({
        id: peticao.id,
        caminhoArquivo: peticao.caminhoArquivo,
        resumo: peticao.resumo,
        createdAt: peticao.createdAt,
        usuarioId: peticao.usuarioId,
      });
    });
  });

  describe('deleteManyWithFiles', () => {
    it('should return zero when there are no ids to delete', async () => {
      const result = await service.deleteManyWithFiles([]);

      expect(result).toEqual({ deleted: 0, fileDeleteFailures: 0 });
      expect(repository.delete).not.toHaveBeenCalled();
      expect(unlink).not.toHaveBeenCalled();
    });

    it('should delete records and related files', async () => {
      repository.delete.mockResolvedValueOnce({ affected: 2 });

      const result = await service.deleteManyWithFiles([
        { id: 1, caminhoArquivo: './uploads/peticoes/a.pdf' } as PeticaoEntity,
        { id: 2, caminhoArquivo: './uploads/peticoes/b.pdf' } as PeticaoEntity,
      ]);

      expect(repository.delete).toHaveBeenCalledWith([1, 2]);
      expect(unlink).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ deleted: 2, fileDeleteFailures: 0 });
    });
  });
});
