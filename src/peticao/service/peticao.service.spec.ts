import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeticaoService } from './peticao.service';
import { PeticaoEntity } from '../entity/peticao.entity';
import { NotFoundException } from '@nestjs/common';

describe('PeticaoService', () => {
  let service: PeticaoService;
  let repository: Repository<PeticaoEntity>;

  const mockPeticao: PeticaoEntity = {
    id: 1,
    caminhoArquivo: 'path/to/file.pdf',
    resumo: 'Resumo da petição',
    teseVetor: '',
    questaoVetor: '',
    createdAt: new Date(),
    usuarioId: 1,
  };

  const mockRepository = {
    find: jest.fn().mockResolvedValue([mockPeticao]),
    findOne: jest.fn().mockResolvedValue(mockPeticao),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeticaoService,
        {
          provide: getRepositoryToken(PeticaoEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PeticaoService>(PeticaoService);
    repository = module.get<Repository<PeticaoEntity>>(getRepositoryToken(PeticaoEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of petitions', async () => {
      const result = await service.findAll();
      expect(result).toEqual([
        {
          id: mockPeticao.id,
          caminhoArquivo: mockPeticao.caminhoArquivo,
          resumo: mockPeticao.resumo,
          createdAt: mockPeticao.createdAt,
          usuarioId: mockPeticao.usuarioId,
        },
      ]);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return an empty array if no petitions found', async () => {
      jest.spyOn(repository, 'find').mockResolvedValueOnce([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single petition', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual({
        id: mockPeticao.id,
        caminhoArquivo: mockPeticao.caminhoArquivo,
        resumo: mockPeticao.resumo,
        createdAt: mockPeticao.createdAt,
        usuarioId: mockPeticao.usuarioId,
      });
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return a petition with null resumo', async () => {
      const peticaoWithNullResumo = { ...mockPeticao, resumo: null };
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(peticaoWithNullResumo);
      const result = await service.findOne(1);
      expect(result.resumo).toBeNull();
    });

    it('should throw NotFoundException if petition not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
