import { Test, TestingModule } from '@nestjs/testing';
import { EspeciePrecedenteController } from '../../../src/precedents/controller/especie-precedente.controller';
import { EspeciePrecedenteService } from '../../../src/precedents/service/especie-precedente.service';
import { EspeciePrecedenteEntity } from '../../../src/precedents/entity/especie_precedente.entity';
import { CreateEspeciePrecedenteDto } from '../../../src/precedents/dto/create-especie-precedente.dto';
import { UpdateResult, DeleteResult } from 'typeorm';

describe('EspeciePrecedenteController', () => {
  let controller: EspeciePrecedenteController;
  let service: jest.Mocked<EspeciePrecedenteService>;

  const mockEspecie: EspeciePrecedenteEntity = {
    id: 1,
    nome: 'Habeas Corpus',
    sigla: 'HC',
  };

  const mockCreateDto: CreateEspeciePrecedenteDto = {
    nome: 'Habeas Corpus',
    sigla: 'HC',
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
      controllers: [EspeciePrecedenteController],
      providers: [
        {
          provide: EspeciePrecedenteService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EspeciePrecedenteController>(EspeciePrecedenteController);
    service = module.get(EspeciePrecedenteService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new especie', async () => {
      service.create.mockResolvedValue(mockEspecie);

      const result = await controller.create(mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockEspecie);
    });
  });

  describe('findAll', () => {
    it('should return an array of especies', async () => {
      const mockEspecies = [mockEspecie];
      service.findAll.mockResolvedValue(mockEspecies);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockEspecies);
    });

    it('should return an empty array when no especies found', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single especie by id', async () => {
      service.findOne.mockResolvedValue(mockEspecie);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockEspecie);
    });

    it('should return null when especie not found', async () => {
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
