import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { StatusPrecedenteService } from '../../../src/precedents/service/status-precedente.service';
import { StatusPrecedenteEntity } from '../../../src/precedents/entity/status_precedente.entity';
import { CreateStatusPrecedenteDto } from '../../../src/precedents/dto/create-status-precedente.dto';

describe('StatusPrecedenteService', () => {
  let service: StatusPrecedenteService;
  let repository: jest.Mocked<Repository<StatusPrecedenteEntity>>;

  const mockStatus: StatusPrecedenteEntity = {
    id: 1,
    nome: 'Ativo',
  };

  const mockCreateDto: CreateStatusPrecedenteDto = {
    nome: 'Ativo',
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
        StatusPrecedenteService,
        {
          provide: getRepositoryToken(StatusPrecedenteEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StatusPrecedenteService>(StatusPrecedenteService);
    repository = module.get(getRepositoryToken(StatusPrecedenteEntity));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new status', async () => {
      repository.create.mockReturnValue(mockStatus);
      repository.save.mockResolvedValue(mockStatus);

      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(repository.save).toHaveBeenCalledWith(mockStatus);
      expect(result).toEqual(mockStatus);
    });
  });

  describe('findAll', () => {
    it('should return an array of status', async () => {
      const mockStatusList = [mockStatus];
      repository.find.mockResolvedValue(mockStatusList);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(mockStatusList);
    });

    it('should return an empty array when no status found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single status by id', async () => {
      repository.findOne.mockResolvedValue(mockStatus);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockStatus);
    });

    it('should return null when status not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });

    it('should handle string id parameter', async () => {
      repository.findOne.mockResolvedValue(mockStatus);

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
