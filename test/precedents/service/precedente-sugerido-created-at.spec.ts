import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrecedenteSugeridoService } from '../../../src/precedents/service/precedente_sugerido.service';
import { PrecedenteSugeridoEntity } from '../../../src/precedents/entity/precedente_sugerido.entity';
import { CreatePrecedenteSugeridoDto } from '../../../src/precedents/dto/create-precedente-sugerido.dto';
import PrecedenteEntity from '../../../src/precedents/entity/precedente.entity';
import { PeticaoEntity } from '../../../src/peticao/entity/peticao.entity';

describe('PrecedenteSugeridoService - createdAt Field', () => {
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

  const mockCreateDto: CreatePrecedenteSugeridoDto = {
    percentual_similaridade: 85.5,
    classificacao: 4,
    sintese_explicativa: 'Síntese explicativa do precedente',
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

  describe('createdAt Field - Basic Validation', () => {
    it('should have createdAt field defined when precedente sugerido is retrieved', async () => {
      const now = new Date();
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: now,
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.findOne.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.findOne(1);

      expect(result?.createdAt).toBeDefined();
      expect(result?.createdAt).toEqual(now);
    });

    it('should be of type Date', async () => {
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: new Date(),
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.findOne.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.findOne(1);

      expect(result?.createdAt instanceof Date).toBe(true);
    });
  });

  describe('createdAt Field - Creation Scenarios', () => {
    it('should set createdAt automatically when creating new record', async () => {
      const now = new Date();
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: now,
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.create.mockReturnValue(mockPrecedenteSugerido);
      repository.save.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.create(mockCreateDto);

      expect(result.createdAt).toBeDefined();
      expect(result.createdAt).toEqual(now);
    });

    it('should not require createdAt in DTO for creation', async () => {
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: new Date(),
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.create.mockReturnValue(mockPrecedenteSugerido);
      repository.save.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.create(mockCreateDto);

      expect(result.createdAt).toBeDefined();
    });

    it('should have same createdAt value after save in create operation', async () => {
      const now = new Date('2026-05-12T10:30:00Z');
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: now,
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.create.mockReturnValue(mockPrecedenteSugerido);
      repository.save.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.create(mockCreateDto);

      expect(result.createdAt).toEqual(now);
    });
  });

  describe('createdAt Field - Bulk Operations', () => {
    it('should set createdAt for all records in bulk create operation', async () => {
      const now = new Date();
      const bulkDtos: CreatePrecedenteSugeridoDto[] = [
        mockCreateDto,
        {
          ...mockCreateDto,
          percentual_similaridade: 90.0,
        },
      ];

      const bulkResults: PrecedenteSugeridoEntity[] = [
        {
          id: 1,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 1',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: now,
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
        {
          id: 2,
          percentual_similaridade: 90.0,
          classificacao: 4,
          sintese_explicativa: 'Síntese 2',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: new Date(now.getTime() + 1000),
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
      ];

      repository.create.mockReturnValue(bulkResults[0]);
      repository.save.mockResolvedValue(bulkResults);

      const result = await service.createBulk(bulkDtos);

      expect(result).toHaveLength(2);
      result.forEach((item) => {
        expect(item.createdAt).toBeDefined();
        expect(item.createdAt instanceof Date).toBe(true);
      });
    });

    it('should have different createdAt timestamps for records created in bulk', async () => {
      const baseTime = new Date('2026-05-12T10:00:00Z');
      const bulkDtos: CreatePrecedenteSugeridoDto[] = [
        mockCreateDto,
        mockCreateDto,
        mockCreateDto,
      ];

      const bulkResults: PrecedenteSugeridoEntity[] = [
        {
          id: 1,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 1',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: baseTime,
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
        {
          id: 2,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 2',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: new Date(baseTime.getTime() + 1000),
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
        {
          id: 3,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 3',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: new Date(baseTime.getTime() + 2000),
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
      ];

      repository.create.mockReturnValue(bulkResults[0]);
      repository.save.mockResolvedValue(bulkResults);

      const result = await service.createBulk(bulkDtos);

      expect(result[0].createdAt.getTime()).toBeLessThan(
        result[1].createdAt.getTime(),
      );
      expect(result[1].createdAt.getTime()).toBeLessThan(
        result[2].createdAt.getTime(),
      );
    });
  });

  describe('createdAt Field - Retrieval Scenarios', () => {
    it('should include createdAt when retrieving single record', async () => {
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: new Date('2026-05-12T10:00:00Z'),
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.findOne.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.findOne(1);

      expect(result?.createdAt).toBeDefined();
    });

    it('should include createdAt for all records in findAll', async () => {
      const now = new Date();
      const mockResults: PrecedenteSugeridoEntity[] = [
        {
          id: 1,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 1',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: now,
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
        {
          id: 2,
          percentual_similaridade: 90.0,
          classificacao: 5,
          sintese_explicativa: 'Síntese 2',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: new Date(now.getTime() + 1000),
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
      ];

      repository.find.mockResolvedValue(mockResults);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      result.forEach((item) => {
        expect(item.createdAt).toBeDefined();
      });
    });

    it('should return null when record not found but no error for createdAt check', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('createdAt Field - Immutability', () => {
    it('should not allow createdAt modification in update operation', async () => {
      const mockUpdateResult: any = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      repository.update.mockResolvedValue(mockUpdateResult);

      const updateDto: any = {
        id: 1,
        percentual_similaridade: 90.0,
        classificacao: 5,
        sintese_explicativa: 'Síntese atualizada',
        precedente_id: 1,
        peticao_id: 1,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      };

      await service.update(1, updateDto);

      const callArgs = repository.update.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('createdAt');
    });

    it('should preserve createdAt timestamp unchanged through lifecycle', async () => {
      const originalCreatedAt = new Date('2026-05-12T09:00:00Z');
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: originalCreatedAt,
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.findOne.mockResolvedValue(mockPrecedenteSugerido);

      const retrieved = await service.findOne(1);

      expect(retrieved?.createdAt).toEqual(originalCreatedAt);
      expect(retrieved?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('createdAt Field - Edge Cases', () => {
    it('should handle createdAt field with millisecond precision', async () => {
      const preciseDate = new Date('2026-05-12T10:30:45.123Z');
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: preciseDate,
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.findOne.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.findOne(1);

      expect(result?.createdAt.getMilliseconds()).toBe(
        preciseDate.getMilliseconds(),
      );
    });

    it('should handle multiple records with createdAt in correct order', async () => {
      const time1 = new Date('2026-05-12T09:00:00Z');
      const time2 = new Date('2026-05-12T10:00:00Z');
      const time3 = new Date('2026-05-12T11:00:00Z');

      const mockResults: PrecedenteSugeridoEntity[] = [
        {
          id: 1,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 1',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: time1,
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
        {
          id: 2,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 2',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: time2,
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
        {
          id: 3,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 3',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: time3,
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
      ];

      repository.find.mockResolvedValue(mockResults);

      const result = await service.findAll();

      expect(result[0].createdAt).toEqual(time1);
      expect(result[1].createdAt).toEqual(time2);
      expect(result[2].createdAt).toEqual(time3);
    });

    it('should have createdAt property enumerable in entity', async () => {
      const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
        id: 1,
        percentual_similaridade: 85.5,
        classificacao: 4,
        sintese_explicativa: 'Síntese explicativa',
        precedenteId: 1,
        peticaoId: 1,
        createdAt: new Date(),
        precedente: mockPrecedente,
        peticao: mockPeticao,
      };

      repository.findOne.mockResolvedValue(mockPrecedenteSugerido);

      const result = await service.findOne(1);

      expect(Object.keys(result || {}).includes('createdAt')).toBe(true);
    });
  });

  describe('createdAt Field - Timestamp Validation', () => {
    it('should maintain chronological order across records', async () => {
      const now = Date.now();
      const mockResults: PrecedenteSugeridoEntity[] = [
        {
          id: 1,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 1',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: new Date(now - 5000),
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
        {
          id: 2,
          percentual_similaridade: 85.5,
          classificacao: 4,
          sintese_explicativa: 'Síntese 2',
          precedenteId: 1,
          peticaoId: 1,
          createdAt: new Date(now),
          precedente: mockPrecedente,
          peticao: mockPeticao,
        },
      ];

      repository.find.mockResolvedValue(mockResults);

      const result = await service.findAll();

      const timestamps = result.map((r) => r.createdAt.getTime());
      expect(timestamps[0] < timestamps[1]).toBe(true);
    });
  });
});
