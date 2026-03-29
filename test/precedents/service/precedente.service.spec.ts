import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { PrecedenteService } from '../../../src/precedents/service/precedente.service';
import PrecedenteEntity from '../../../src/precedents/entity/precedente.entity';
import { CreatePrecedenteDto } from '../../../src/precedents/dto/create-precedente.dto';
import { UpdatePrecedenteDto } from '../../../src/precedents/dto/update-precedente.dto';
import { StatusPrecedenteEntity } from '../../../src/precedents/entity/status_precedente.entity';
import { TribunalPrecedenteEntity } from '../../../src/precedents/entity/tribunal_precedente.entity';
import { EspeciePrecedenteEntity } from '../../../src/precedents/entity/especie_precedente.entity';

describe('PrecedenteService', () => {
  let service: PrecedenteService;
  let repository: jest.Mocked<Repository<PrecedenteEntity>>;

  const mockStatus: StatusPrecedenteEntity = {
    id: 1,
    nome: 'Ativo',
    precedente: [],
  };

  const mockTribunal: TribunalPrecedenteEntity = {
    id: 1,
    nome: 'Tribunal de Justiça',
    sigla: 'TJ',
    precedente: [],
  };

  const mockEspecie: EspeciePrecedenteEntity = {
    id: 1,
    nome: 'Habeas Corpus',
    sigla: 'HC',
    precedente: [],
  };

  const mockPrecedente: PrecedenteEntity = {
    id: 1,
    numero_registro: '12345',
    tese: 'Tese do precedente',
    questao: 'Questão do precedente',
    tese_vetor: [1.0, 2.5, 3.7],
    questao_vetor: [1.2, 2.8, 3.4],
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
    tese_vetor: [1.0, 2.5, 3.7],
    questao_vetor: [1.2, 2.8, 3.4],
    questao: 'Questão do precedente',
    status: mockStatus,
    tribunal: mockTribunal,
    especie: mockEspecie,
  };

  const mockUpdateDto: UpdatePrecedenteDto = {
    id: 1,
    numero_registro: 12346,
    tese: 'Tese atualizada',
    questao: 'Questão atualizada',
    status: mockStatus,
    tribunal: mockTribunal,
    especie: mockEspecie,
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
        PrecedenteService,
        {
          provide: getRepositoryToken(PrecedenteEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PrecedenteService>(PrecedenteService);
    repository = module.get(getRepositoryToken(PrecedenteEntity));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new precedente', async () => {
      const expectedEntity = {
        numero_registro: '12345',
        tese: 'Tese do precedente',
        questao: 'Questão do precedente',
        tese_vetor: [1.0, 2.5, 3.7],
        questao_vetor: [1.2, 2.8, 3.4],
        ultima_atualizacao: expect.any(Date),
        status: mockStatus,
        tribunal: mockTribunal,
        especie: mockEspecie,
      };
      repository.create.mockReturnValue(expectedEntity as PrecedenteEntity);
      repository.save.mockResolvedValue(mockPrecedente);

      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith({
        numero_registro: '12345',
        tese: 'Tese do precedente',
        questao: 'Questão do precedente',
        tese_vetor: [1.0, 2.5, 3.7],
        questao_vetor: [1.2, 2.8, 3.4],
        ultima_atualizacao: expect.any(Date),
        status: mockStatus,
        tribunal: mockTribunal,
        especie: mockEspecie,
      });
      expect(repository.save).toHaveBeenCalledWith(expectedEntity);
      expect(result).toEqual(mockPrecedente);
    });

    it('should set ultima_atualizacao to current date when not provided', async () => {
      const dtoWithoutDate = {
        ...mockCreateDto,
        ultima_atualizacao: undefined,
      };

      const expectedEntity = {
        numero_registro: '12345',
        tese: 'Tese do precedente',
        questao: 'Questão do precedente',
        tese_vetor: [1.0, 2.5, 3.7],
        questao_vetor: [1.2, 2.8, 3.4],
        ultima_atualizacao: expect.any(Date),
        status: mockStatus,
        tribunal: mockTribunal,
        especie: mockEspecie,
      };

      repository.create.mockReturnValue(expectedEntity as PrecedenteEntity);
      repository.save.mockResolvedValue(mockPrecedente);

      await service.create(dtoWithoutDate);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          numero_registro: '12345',
          tese: 'Tese do precedente',
          questao: 'Questão do precedente',
          tese_vetor: [1.0, 2.5, 3.7],
          questao_vetor: [1.2, 2.8, 3.4],
          ultima_atualizacao: expect.any(Date),
          status: mockStatus,
          tribunal: mockTribunal,
          especie: mockEspecie,
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of precedentes with relations', async () => {
      const mockPrecedentes = [mockPrecedente];
      repository.find.mockResolvedValue(mockPrecedentes);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['status', 'tribunal', 'especie', 'precedenteSugerido'],
      });
      expect(result).toEqual(mockPrecedentes);
    });

    it('should return an empty array when no precedentes found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['status', 'tribunal', 'especie', 'precedenteSugerido'],
      });
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single precedente by id with relations', async () => {
      repository.findOne.mockResolvedValue(mockPrecedente);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['status', 'tribunal', 'especie', 'precedenteSugerido'],
      });
      expect(result).toEqual(mockPrecedente);
    });

    it('should return null when precedente not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['status', 'tribunal', 'especie', 'precedenteSugerido'],
      });
      expect(result).toBeNull();
    });

    it('should handle string id parameter', async () => {
      repository.findOne.mockResolvedValue(mockPrecedente);

      await service.findOne('1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['status', 'tribunal', 'especie', 'precedenteSugerido'],
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

      const result = await service.update(1, mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith(1, {
        numero_registro: '12346',
        tese: 'Tese atualizada',
        questao: 'Questão atualizada',
        ultima_atualizacao: expect.any(Date),
        status: mockStatus,
        tribunal: mockTribunal,
        especie: mockEspecie,
      });
      expect(result).toEqual(mockUpdateResult);
    });

    it('should set ultima_atualizacao to current date when not provided', async () => {
      const dtoWithoutDate = {
        ...mockUpdateDto,
        ultima_atualizacao: undefined,
      };
      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      repository.update.mockResolvedValue(mockUpdateResult);

      await service.update(1, dtoWithoutDate);

      expect(repository.update).toHaveBeenCalledWith(1, {
        numero_registro: '12346',
        tese: 'Tese atualizada',
        questao: 'Questão atualizada',
        ultima_atualizacao: expect.any(Date),
        status: mockStatus,
        tribunal: mockTribunal,
        especie: mockEspecie,
      });
    });

    it('should handle string id parameter', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      repository.update.mockResolvedValue(mockUpdateResult);

      await service.update('1', mockUpdateDto);

      expect(repository.update).toHaveBeenCalledWith(1, {
        numero_registro: '12346',
        tese: 'Tese atualizada',
        questao: 'Questão atualizada',
        ultima_atualizacao: expect.any(Date),
        status: mockStatus,
        tribunal: mockTribunal,
        especie: mockEspecie,
      });
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
