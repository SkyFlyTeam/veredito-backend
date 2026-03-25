import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { EspeciePrecedenteService } from '../../../src/precedents/service/especie-precedente.service';
import { EspeciePrecedenteEntity } from '../../../src/precedents/entity/especie_precedente.entity';
import { CreateEspeciePrecedenteDto } from '../../../src/precedents/dto/create-especie-precedente.dto';

describe('EspeciePrecedenteService', () => {
  let service: EspeciePrecedenteService;
  let repository: jest.Mocked<Repository<EspeciePrecedenteEntity>>;

  const mockEspecie: EspeciePrecedenteEntity = {
    id: 1,
    nome: 'Habeas Corpus',
    sigla: 'HC',
  };

  const mockCreateDto: CreateEspeciePrecedenteDto = {
    nome: 'Habeas Corpus',
    sigla: 'HC',
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
        EspeciePrecedenteService,
        {
          provide: getRepositoryToken(EspeciePrecedenteEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EspeciePrecedenteService>(EspeciePrecedenteService);
    repository = module.get(getRepositoryToken(EspeciePrecedenteEntity));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new especie', async () => {
      repository.create.mockReturnValue(mockEspecie);
      repository.save.mockResolvedValue(mockEspecie);

      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(repository.save).toHaveBeenCalledWith(mockEspecie);
      expect(result).toEqual(mockEspecie);
    });
  });

  describe('findAll', () => {
    it('should return an array of especies', async () => {
      const mockEspecies = [mockEspecie];
      repository.find.mockResolvedValue(mockEspecies);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(mockEspecies);
    });

    it('should return an empty array when no especies found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single especie by id', async () => {
      repository.findOne.mockResolvedValue(mockEspecie);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockEspecie);
    });

    it('should return null when especie not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });

    it('should handle string id parameter', async () => {
      repository.findOne.mockResolvedValue(mockEspecie);

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
