import { Test, TestingModule } from '@nestjs/testing';
import { StatusPrecedenteController } from '../../../src/precedents/controller/status-precedente.controller';
import { StatusPrecedenteService } from '../../../src/precedents/service/status-precedente.service';
import { StatusPrecedenteEntity } from '../../../src/precedents/entity/status_precedente.entity';
import { CreateStatusPrecedenteDto } from '../../../src/precedents/dto/create-status-precedente.dto';
import { UpdateResult, DeleteResult } from 'typeorm';

describe('StatusPrecedenteController', () => {
  let controller: StatusPrecedenteController;
  let service: jest.Mocked<StatusPrecedenteService>;

  const mockStatus: StatusPrecedenteEntity = {
    id: 1,
    nome: 'Ativo',
  };

  const mockCreateDto: CreateStatusPrecedenteDto = {
    nome: 'Ativo',
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusPrecedenteController],
      providers: [
        {
          provide: StatusPrecedenteService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<StatusPrecedenteController>(StatusPrecedenteController);
    service = module.get(StatusPrecedenteService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new status', async () => {
      service.create.mockResolvedValue(mockStatus);

      const result = await controller.create(mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockStatus);
    });
  });

  describe('findAll', () => {
    it('should return an array of status', async () => {
      const mockStatusList = [mockStatus];
      service.findAll.mockResolvedValue(mockStatusList);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockStatusList);
    });

    it('should return an empty array when no status found', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single status by id', async () => {
      service.findOne.mockResolvedValue(mockStatus);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStatus);
    });

    it('should return null when status not found', async () => {
      service.findOne.mockResolvedValue(null);

      const result = await controller.findOne(999);

      expect(service.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return UpdateResult', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      service.update.mockResolvedValue(mockUpdateResult);

      const result = await controller.update(1, mockCreateDto);

      expect(service.update).toHaveBeenCalledWith(1, mockCreateDto);
      expect(result).toEqual(mockUpdateResult);
    });
  });

  describe('remove', () => {
    it('should delete and return DeleteResult', async () => {
      const mockDeleteResult: DeleteResult = {
        affected: 1,
        raw: {},
      };
      service.delete.mockResolvedValue(mockDeleteResult);

      const result = await controller.remove(1);

      expect(service.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeleteResult);
    });
  });
});
