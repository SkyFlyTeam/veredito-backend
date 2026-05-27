import { CasoJuridicoCrudService } from '../../src/caso_juridico/service/caso-juridico-crud.service';
import { NotFoundException } from '@nestjs/common';
import { CasoJuridicoEntity } from '../../src/caso_juridico/entity/caso_juridico.entity';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeCasoJuridico = (): CasoJuridicoEntity =>
  ({
    id: 1,
    area_direito: 'Direito do Trabalho',
    pedidos_principais: 'Indenização por danos morais e materiais',
    tese_pretendida: 'Responsabilidade civil do empregador',
    uf: 'SP',
    fatos_estruturados: 'O requerente firmou contrato de trabalho...',
    fundamentos_juridicos: 'O caso encontra amparo no art. 186 do CC...',
    tribunalPrecedenteId: null,
    createdAt: new Date('2024-01-10'),
    usuarioId: 1,
    usuario: null as any,
    secoesPeticao: [],
    tribunal_precedente: null as any,
    precedentesSugeridos: [],
  }) as CasoJuridicoEntity;

const makeDto = () => ({
  area_direito: 'Direito do Trabalho',
  pedidos_principais: 'Indenização por danos morais e materiais',
  tese_pretendida: 'Responsabilidade civil do empregador',
  uf: 'SP',
  tribunalPrecedenteId: undefined,
});

const makeMockFile = (originalname: string): any => ({
  originalname,
  buffer: Buffer.from('conteúdo de teste'),
  mimetype: 'application/pdf',
  size: 100,
});

// ── Factories de mock ─────────────────────────────────────────────────────────

const createCasoRepositoryMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const createExtractionServiceMock = () => ({
  extractFromDocuments: jest.fn(),
});

// ── Suite principal ───────────────────────────────────────────────────────────

describe('CasoJuridicoCrudService', () => {
  let service: CasoJuridicoCrudService;
  let casoRepository: ReturnType<typeof createCasoRepositoryMock>;
  let extractionService: ReturnType<typeof createExtractionServiceMock>;

  beforeEach(() => {
    jest.resetAllMocks();

    casoRepository = createCasoRepositoryMock();
    extractionService = createExtractionServiceMock();

    service = new CasoJuridicoCrudService(
      casoRepository as any,
      extractionService as any,
    );
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('deve criar e retornar um novo caso jurídico', async () => {
      const caso = makeCasoJuridico();
      const dto = makeDto();
      const files = [makeMockFile('contrato.pdf')];

      extractionService.extractFromDocuments.mockResolvedValue({
        fatosEstruturados: caso.fatos_estruturados,
        fundamentosJuridicos: caso.fundamentos_juridicos,
      });
      casoRepository.create.mockReturnValue(caso);
      casoRepository.save.mockResolvedValue(caso);

      const result = await service.create(dto as any, files, 1);

      expect(extractionService.extractFromDocuments).toHaveBeenCalledWith(files, expect.any(String));
      expect(casoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          area_direito: dto.area_direito,
          pedidos_principais: dto.pedidos_principais,
          tese_pretendida: dto.tese_pretendida,
          uf: dto.uf,
          usuarioId: 1,
          fatos_estruturados: caso.fatos_estruturados,
          fundamentos_juridicos: caso.fundamentos_juridicos,
        }),
      );
      expect(casoRepository.save).toHaveBeenCalledWith(caso);
      expect(result.id).toBe(caso.id);
      expect(result.area_direito).toBe(caso.area_direito);
    });

    it('deve usar tribunalPrecedenteId quando fornecido', async () => {
      const caso = { ...makeCasoJuridico(), tribunalPrecedenteId: 5 };
      const dto = { ...makeDto(), tribunalPrecedenteId: 5 };
      const files = [makeMockFile('contrato.pdf')];

      extractionService.extractFromDocuments.mockResolvedValue({
        fatosEstruturados: 'fatos',
        fundamentosJuridicos: 'fundamentos',
      });
      casoRepository.create.mockReturnValue(caso);
      casoRepository.save.mockResolvedValue(caso);

      const result = await service.create(dto as any, files, 1);

      expect(casoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tribunalPrecedenteId: 5 }),
      );
      expect(result.tribunalPrecedenteId).toBe(5);
    });

    it('deve propagar erro do extractionService', async () => {
      extractionService.extractFromDocuments.mockRejectedValue(
        new Error('Falha na extração'),
      );

      await expect(
        service.create(makeDto() as any, [makeMockFile('doc.pdf')], 1),
      ).rejects.toThrow('Falha na extração');
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar uma lista de casos jurídicos', async () => {
      const casos = [makeCasoJuridico(), { ...makeCasoJuridico(), id: 2 }];
      casoRepository.find.mockResolvedValue(casos);

      const result = await service.findAll();

      expect(casoRepository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('deve retornar array vazio quando não há casos', async () => {
      casoRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('deve retornar um caso jurídico pelo ID', async () => {
      const caso = makeCasoJuridico();
      casoRepository.findOne.mockResolvedValue(caso);

      const result = await service.findOne(1);

      expect(casoRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.id).toBe(caso.id);
      expect(result.area_direito).toBe(caso.area_direito);
    });

    it('deve lançar NotFoundException quando caso não encontrado', async () => {
      casoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException com mensagem correta', async () => {
      casoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(42)).rejects.toThrow(
        'Caso Jurídico com ID 42 não encontrado',
      );
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deve deletar um caso jurídico pelo ID', async () => {
      const caso = makeCasoJuridico();
      casoRepository.findOne.mockResolvedValue(caso);
      casoRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(casoRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(casoRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar NotFoundException ao deletar caso inexistente', async () => {
      casoRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it('não deve chamar delete quando caso não é encontrado', async () => {
      casoRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      expect(casoRepository.delete).not.toHaveBeenCalled();
    });
  });

  // ── mapToResponseDto ──────────────────────────────────────────────────────

  describe('mapToResponseDto', () => {
    it('deve mapear todos os campos corretamente', async () => {
      const caso = makeCasoJuridico();
      casoRepository.findOne.mockResolvedValue(caso);

      const result = await service.findOne(1);

      expect(result).toEqual({
        id: caso.id,
        area_direito: caso.area_direito,
        pedidos_principais: caso.pedidos_principais,
        tese_pretendida: caso.tese_pretendida,
        uf: caso.uf,
        fatos_estruturados: caso.fatos_estruturados,
        fundamentos_juridicos: caso.fundamentos_juridicos,
        tribunalPrecedenteId: caso.tribunalPrecedenteId,
        createdAt: caso.createdAt,
        usuarioId: caso.usuarioId,
      });
    });

    it('deve mapear campos nullable como null quando não preenchidos', async () => {
      const caso = {
        ...makeCasoJuridico(),
        fatos_estruturados: null,
        fundamentos_juridicos: null,
        tribunalPrecedenteId: null,
      };
      casoRepository.findOne.mockResolvedValue(caso);

      const result = await service.findOne(1);

      expect(result.fatos_estruturados).toBeNull();
      expect(result.fundamentos_juridicos).toBeNull();
      expect(result.tribunalPrecedenteId).toBeNull();
    });
  });
});