import { Test, TestingModule } from '@nestjs/testing';
import { PrecedenteController } from '../../../src/precedents/controller/precedente.controller';
import { PrecedenteService } from '../../../src/precedents/service/precedente.service';
import PrecedenteEntity from '../../../src/precedents/entity/precedente.entity';
import { CreatePrecedenteDto } from '../../../src/precedents/dto/create-precedente.dto';
import { UpdatePrecedenteDto } from '../../../src/precedents/dto/update-precedente.dto';
import { StatusPrecedenteEntity } from '../../../src/precedents/entity/status_precedente.entity';
import { TribunalPrecedenteEntity } from '../../../src/precedents/entity/tribunal_precedente.entity';
import { EspeciePrecedenteEntity } from '../../../src/precedents/entity/especie_precedente.entity';
import { UpdateResult, DeleteResult } from 'typeorm';

describe('PrecedenteController', () => {
  let controller: PrecedenteController;
  let service: jest.Mocked<PrecedenteService>;

  const mockStatus: StatusPrecedenteEntity = {
    id: 1,
    nome: 'Ativo',
  };

  const mockTribunal: TribunalPrecedenteEntity = {
    id: 1,
    nome: 'Tribunal de Justiça',
    sigla: 'TJ',
  };

  const mockEspecie: EspeciePrecedenteEntity = {
    id: 1,
    nome: 'Habeas Corpus',
    sigla: 'HC',
  };

  const mockPrecedente: PrecedenteEntity = {
    id: 1,
    numero_registro: 12345,
    tese: 'Tese do precedente',
    tese_vetor: 'tese vetor',
    questao_vetor: 'questao vetor',
    ultima_atualizacao: new Date(),
    createdAt: new Date(),
    status: mockStatus,
    tribunal: mockTribunal,
    especie: mockEspecie,
    precedenteSugerido: [],
  };

  const mockCreateDto: CreatePrecedenteDto = {
    numero_registro: 12345,
    tese: 'Tese do precedente',
    tese_vetor: 'tese vetor',
    questao_vetor: 'questao vetor',
    user_id: 1,
    status: mockStatus,
    tribunal: mockTribunal,
    especie: mockEspecie,
  };

  const mockUpdateDto: UpdatePrecedenteDto = {
    id: 1,
    numero_registro: 12346,
    tese: 'Tese atualizada',
    status: mockStatus,
    tribunal: mockTribunal,
    especie: mockEspecie,
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
      controllers: [PrecedenteController],
      providers: [
        {
          provide: PrecedenteService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PrecedenteController>(PrecedenteController);
    service = module.get(PrecedenteService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new precedente', async () => {
      service.create.mockResolvedValue(mockPrecedente);

      const result = await controller.create(mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockPrecedente);
    });
  });

  describe('findOne', () => {
    it('should return a single precedente by id', async () => {
      service.findOne.mockResolvedValue(mockPrecedente);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPrecedente);
    });

    it('should return null when precedente not found', async () => {
      service.findOne.mockResolvedValue(null);

      const result = await controller.findOne(999);

      expect(service.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an array of precedentes', async () => {
      const mockPrecedentes = [mockPrecedente];
      service.findAll.mockResolvedValue(mockPrecedentes);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPrecedentes);
    });

    it('should return an empty array when no precedentes found', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
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

      const result = await controller.update(mockUpdateDto);

      expect(service.update).toHaveBeenCalledWith(mockUpdateDto.id, mockUpdateDto);
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
