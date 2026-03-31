import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { PrecedenteSugeridoService } from '../../../src/precedents/service/precedente_sugerido.service';
import { PrecedenteSugeridoEntity } from '../../../src/precedents/entity/precedente_sugerido.entity';
import { CreatePrecedenteSugeridoDto } from '../../../src/precedents/dto/create-precedente-sugerido.dto';
import { UpdatePrecedenteSugeridoDto } from '../../../src/precedents/dto/update-precedente-sugerido.dto';
import PrecedenteEntity from '../../../src/precedents/entity/precedente.entity';
import { PeticaoEntity } from '../../../src/peticao/entity/peticao.entity';

describe('PrecedenteSugeridoService', () => {
  let service: PrecedenteSugeridoService;
  let repository: jest.Mocked<Repository<PrecedenteSugeridoEntity>>;

  const mockPrecedente: PrecedenteEntity = {
    id: 1,
    numero_registro: '12345',
    tese: 'Tese do precedente',
    questao: 'Questao do precedente',
    tese_vetor: [],
    questao_vetor: [],
    ultima_atualizacao: new Date(),
    createdAt: new Date(),
    status: { id: 1, nome: 'Ativo', precedente: [] } as any,
    tribunal: { id: 1, nome: 'TJ', sigla: 'TJ', precedente: [] } as any,
    especie: { id: 1, nome: 'HC', sigla: 'HC', precedente: [] } as any,
    precedenteSugerido: [],
  };

  const mockPeticao: PeticaoEntity = {
    id: 1,
    caminhoArquivo: 'path/to/file.pdf',
    resumo: 'Resumo da petição',
    teseVetor: [],
    questaoVetor: [],
    createdAt: new Date(),
    usuarioId: 1,
    user: {
      id: 1,
      nome: 'Test User',
      sobrenome: 'Test',
      email: 'test@example.com',
      password: Buffer.from('password', 'utf-8'),
      accessLevel: { id: '1', nome: 'superuser', users: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
      peticoes: [],
    } as any,
    precedenteSugerido: [],
  };

  const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
    id: 1,
    percentual_similaridade: 85.5,
    classificacao: 4,
    sintese_explicativa: 'Síntese explicativa do precedente',
    precedenteId: 1,
    peticaoId: 1,
    precedente: mockPrecedente,
    peticao: mockPeticao,
  };

  const mockCreateDto: CreatePrecedenteSugeridoDto = {
    percentual_similaridade: 85.5,
    classificacao: 4,
    sintese_explicativa: 'Síntese explicativa do precedente',
    precedente_id: 1,
    peticao_id: 1,
  };

  const mockUpdateDto: UpdatePrecedenteSugeridoDto = {
    id: 1,
    percentual_similaridade: 90.0,
    classificacao: 5,
    sintese_explicativa: 'Síntese atualizada',
    precedente_id: 1,
    peticao_id: 1,
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
        PrecedenteSugeridoService,
        {
          provide: getRepositoryToken(PrecedenteSugeridoEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PrecedenteSugeridoService>(PrecedenteSugeridoService);
    repository = module.get(getRepositoryToken(PrecedenteSugeridoEntity));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new precedente sugerido', async () => {
      repository.create.mockReturnValue(mockPrecedenteSugerido);
      repository.save.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.create(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith({
        percentual_similaridade: mockCreateDto.percentual_similaridade,
        classificacao: mockCreateDto.classificacao,
        sintese_explicativa: mockCreateDto.sintese_explicativa,
        precedente: { id: mockCreateDto.precedente_id },
        peticao: { id: mockCreateDto.peticao_id },
      });
      expect(repository.save).toHaveBeenCalledWith(mockPrecedenteSugerido);
      expect(result).toEqual(mockPrecedenteSugerido);
    });
  });

  describe('findAll', () => {
    it('should return an array of precedentes sugeridos with relations', async () => {
      const mockPrecedentesSugeridos = [mockPrecedenteSugerido];
      repository.find.mockResolvedValue(mockPrecedentesSugeridos);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: [
          'precedente',
          'precedente.status',
          'precedente.tribunal',
          'precedente.especie',
          'peticao',
        ],
      });
      expect(result).toEqual(mockPrecedentesSugeridos);
    });

    it('should return an empty array when no precedentes sugeridos found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: [
          'precedente',
          'precedente.status',
          'precedente.tribunal',
          'precedente.especie',
          'peticao',
        ],
      });
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single precedente sugerido by id with relations', async () => {
      repository.findOne.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'precedente',
          'precedente.status',
          'precedente.tribunal',
          'precedente.especie',
          'peticao',
        ],
      });
      expect(result).toEqual(mockPrecedenteSugerido);
    });

    it('should return null when precedente sugerido not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: [
          'precedente',
          'precedente.status',
          'precedente.tribunal',
          'precedente.especie',
          'peticao',
        ],
      });
      expect(result).toBeNull();
    });

    it('should handle string id parameter', async () => {
      repository.findOne.mockResolvedValue(mockPrecedenteSugerido);

      await service.findOne('1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'precedente',
          'precedente.status',
          'precedente.tribunal',
          'precedente.especie',
          'peticao',
        ],
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
        percentual_similaridade: 90.0,
        classificacao: 5,
        sintese_explicativa: 'Síntese atualizada',
        precedente: { id: 1 },
        peticao: { id: 1 },
      });
      expect(result).toEqual(mockUpdateResult);
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
        percentual_similaridade: 90.0,
        classificacao: 5,
        sintese_explicativa: 'Síntese atualizada',
        precedente: { id: 1 },
        peticao: { id: 1 },
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
