import { Test, TestingModule } from '@nestjs/testing';
import { PrecedenteSugeridoController } from '../../../src/precedents/controller/precedente-sugerido.controller';
import { PrecedenteSugeridoService } from '../../../src/precedents/service/precedente_sugerido.service';
import { PrecedenteSugeridoEntity } from '../../../src/precedents/entity/precedente_sugerido.entity';
import { CreatePrecedenteSugeridoDto } from '../../../src/precedents/dto/create-precedente-sugerido.dto';
import { UpdatePrecedenteSugeridoDto } from '../../../src/precedents/dto/update-precedente-sugerido.dto';
import { UpdateResult, DeleteResult } from 'typeorm';
import PrecedenteEntity from '../../../src/precedents/entity/precedente.entity';
import { PeticaoEntity } from '../../../src/peticao/entity/peticao.entity';

describe('PrecedenteSugeridoController', () => {
  let controller: PrecedenteSugeridoController;
  let service: jest.Mocked<PrecedenteSugeridoService>;

  const mockPrecedente: PrecedenteEntity = {
    id: 1,
    numero_registro: 12345,
    tese: 'Tese do precedente',
    tese_vetor: 'tese vetor',
    questao_vetor: 'questao vetor',
    ultima_atualizacao: new Date(),
    createdAt: new Date(),
    status: { id: 1, nome: 'Ativo' },
    tribunal: { id: 1, nome: 'TJ', sigla: 'TJ' },
    especie: { id: 1, nome: 'HC', sigla: 'HC' },
    precedenteSugerido: [],
  };

  const mockPeticao: PeticaoEntity = {
    id: 1,
    caminhoArquivo: 'path/to/file.pdf',
    resumo: 'Resumo da petição',
    teseVetor: 'tese vetor',
    questaoVetor: 'questao vetor',
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
    },
  };

  const mockPrecedenteSugerido: PrecedenteSugeridoEntity = {
    id: 1,
    percentual_similaridade: 85.5,
    classificacao: 4,
    sintese_explicativa: 'Síntese explicativa do precedente',
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

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrecedenteSugeridoController],
      providers: [
        {
          provide: PrecedenteSugeridoService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PrecedenteSugeridoController>(PrecedenteSugeridoController);
    service = module.get(PrecedenteSugeridoService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new precedente sugerido', async () => {
      service.create.mockResolvedValue(mockPrecedenteSugerido);

      const result = await controller.create(mockCreateDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockPrecedenteSugerido);
    });
  });

  describe('findAll', () => {
    it('should return an array of precedentes sugeridos', async () => {
      const mockPrecedentesSugeridos = [mockPrecedenteSugerido];
      service.findAll.mockResolvedValue(mockPrecedentesSugeridos);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPrecedentesSugeridos);
    });

    it('should return an empty array when no precedentes sugeridos found', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single precedente sugerido by id', async () => {
      service.findOne.mockResolvedValue(mockPrecedenteSugerido);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPrecedenteSugerido);
    });

    it('should return null when precedente sugerido not found', async () => {
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
