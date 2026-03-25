import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { TribunalPrecedenteService } from '../../../src/precedents/service/tribunal-precedente.service';
import { TribunalPrecedenteEntity } from '../../../src/precedents/entity/tribunal_precedente.entity';
import { CreateTribunalPrecedenteDto } from '../../../src/precedents/dto/create-tribunal-precedente.dto';

describe('TribunalPrecedenteService', () => {
  let service: TribunalPrecedenteService;
  let repository: jest.Mocked<Repository<TribunalPrecedenteEntity>>;

  const mockTribunal: TribunalPrecedenteEntity = {
    id: 1,
    nome: 'Tribunal de Justiça',
    sigla: 'TJ',
  };

  const mockCreateDto: CreateTribunalPrecedenteDto = {
    nome: 'Tribunal de Justiça',
    sigla: 'TJ',
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TribunalPrecedenteService,
        {
          provide: getRepositoryToken(TribunalPrecedenteEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TribunalPrecedenteService>(TribunalPrecedenteService);
    repository = module.get(getRepositoryToken(TribunalPrecedenteEntity));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new tribunal', async () => {
      repository.create.mockReturnValue(mockTribunal);
      repository.save.mockResolvedValue(mockTribunal);

      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(repository.save).toHaveBeenCalledWith(mockTribunal);
      expect(result).toEqual(mockTribunal);
    });
  });

  describe('findAll', () => {
    it('should return an array of tribunals', async () => {
      const mockTribunals = [mockTribunal];
      repository.find.mockResolvedValue(mockTribunals);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(mockTribunals);
    });

    it('should return an empty array when no tribunals found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single tribunal by id', async () => {
      repository.findOne.mockResolvedValue(mockTribunal);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockTribunal);
    });

    it('should return null when tribunal not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });

    it('should handle string id parameter', async () => {
      repository.findOne.mockResolvedValue(mockTribunal);

      await service.findOne('1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('update', () => {
    it('should update and return UpdateResult', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      repository.update.mockResolvedValue(mockUpdateResult);

      const result = await service.update(1, mockCreateDto);

      expect(repository.update).toHaveBeenCalledWith(1, mockCreateDto);
      expect(result).toEqual(mockUpdateResult);
    });

    it('should handle string id parameter', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      repository.update.mockResolvedValue(mockUpdateResult);

      await service.update('1', mockCreateDto);

      expect(repository.update).toHaveBeenCalledWith(1, mockCreateDto);
    });
  });

  describe('delete', () => {
    it('should delete and return DeleteResult', async () => {
      const mockDeleteResult: DeleteResult = {
        affected: 1,
        raw: {},
      };
      repository.delete.mockResolvedValue(mockDeleteResult);

      const result = await service.delete(1);

      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeleteResult);
    });

    it('should handle string id parameter', async () => {
      const mockDeleteResult: DeleteResult = {
        affected: 1,
        raw: {},
      };
      repository.delete.mockResolvedValue(mockDeleteResult);

      await service.delete('1');

      expect(repository.delete).toHaveBeenCalledWith(1);
    });
  });
});
