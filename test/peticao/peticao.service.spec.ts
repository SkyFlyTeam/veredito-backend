import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PeticaoService } from '../../src/peticao/service/peticao.service';
import { PeticaoEntity } from '../../src/peticao/entity/peticao.entity';
import { NotFoundException } from '@nestjs/common';

const makePeticao = (): PeticaoEntity => ({
  id: 1,
  caminhoArquivo: 'path/to/file.pdf',
  resumo: 'Resumo da petição',
  teseVetor: '',
  questaoVetor: '',
  createdAt: new Date(),
  usuarioId: 1,
  user: null as any,
});

const createPeticaoRepositoryMock = () => ({
  find: jest.fn((): Promise<PeticaoEntity[]> => Promise.resolve([])),
  findOne: jest.fn((): Promise<PeticaoEntity | null> => Promise.resolve(null)),
  create: jest.fn(),
  save: jest.fn(),
});

describe('PeticaoService', () => {
  let service: PeticaoService;
  let repository: ReturnType<typeof createPeticaoRepositoryMock>;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = createPeticaoRepositoryMock();
    service = new PeticaoService(repository as never);
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
    it('should create and save a new petition', async () => {
      const filePath = 'path/to/file.pdf';
      const usuarioId = 1;
      const peticao = makePeticao();

      repository.create.mockReturnValueOnce(peticao);
      repository.save.mockResolvedValueOnce(peticao);

      await service.create(filePath, usuarioId);

      expect(repository.create).toHaveBeenCalledWith({
        caminhoArquivo: filePath,
        usuarioId,
      });
      expect(repository.save).toHaveBeenCalledWith(peticao);
    });
  });
});
