import { Test, TestingModule } from '@nestjs/testing';
import { TribunalPrecedenteController } from '../../../src/precedents/controller/tribunal-precedente.controller';
import { TribunalPrecedenteService } from '../../../src/precedents/service/tribunal-precedente.service';
import { TribunalPrecedenteEntity } from '../../../src/precedents/entity/tribunal_precedente.entity';
import { CreateTribunalPrecedenteDto } from '../../../src/precedents/dto/create-tribunal-precedente.dto';
import { UpdateResult, DeleteResult } from 'typeorm';

describe('TribunalPrecedenteController', () => {
  let controller: TribunalPrecedenteController;
  let service: jest.Mocked<TribunalPrecedenteService>;

  const mockTribunal: TribunalPrecedenteEntity = {
    id: 1,
    nome: 'Tribunal de Justiça',
    sigla: 'TJ',
  };

  const mockCreateDto: CreateTribunalPrecedenteDto = {
    nome: 'Tribunal de Justiça',
    sigla: 'TJ',
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
      controllers: [TribunalPrecedenteController],
      providers: [
        {
          provide: TribunalPrecedenteService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TribunalPrecedenteController>(TribunalPrecedenteController);
    service = module.get(TribunalPrecedenteService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new tribunal', async () => {
      service.create.mockResolvedValue(mockTribunal);

      const result = await controller.create(mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockTribunal);
    });
  });

  describe('findAll', () => {
    it('should return an array of tribunals', async () => {
      const mockTribunals = [mockTribunal];
      service.findAll.mockResolvedValue(mockTribunals);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTribunals);
    });

    it('should return an empty array when no tribunals found', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single tribunal by id', async () => {
      service.findOne.mockResolvedValue(mockTribunal);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTribunal);
    });

    it('should return null when tribunal not found', async () => {
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
