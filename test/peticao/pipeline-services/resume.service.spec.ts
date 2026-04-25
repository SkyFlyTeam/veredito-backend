/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ResumeService,
  ResumeData,
} from '../../../src/peticao/pipeline-services/resume/resume.service';
import { PeticaoEntity } from '../../../src/peticao/entity/peticao.entity';
import { PeticaoSummary } from '../../../src/peticao/pipeline-services/summary/summary.service';
import { UserEntity } from '../../../src/account/user/entity/user.entity';
describe('ResumeService', () => {
  let service: ResumeService;
  let peticaoRepository: jest.Mocked<Repository<PeticaoEntity>>;

  const mockUserEntity: UserEntity = {
    id: 1,
    nome: 'Test',
    sobrenome: 'User',
    email: 'test@example.com',
    password: Buffer.from('password'),
    accessLevel: {
      id: 'test-id',
      nome: 'Admin',
      users: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    peticoes: [],
  };

  const mockPeticaoEntity: PeticaoEntity = {
    id: 1,
    caminhoArquivo: 'test-path.docx',
    resumo: null,
    teseVetor: null,
    questaoVetor: null,
    createdAt: new Date(),
    usuarioId: 1,
    user: mockUserEntity,
    precedenteSugerido: [],
  };

  const mockSummary: PeticaoSummary = {
    teseJuridica: 'Esta é uma tese jurídica de teste sobre direitos civis.',
    solicitacaoPedido:
      'Requer-se a condenação do réu ao pagamento de indenização por danos morais.',
  };

  beforeEach(async () => {
    const mockPeticaoRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        {
          provide: getRepositoryToken(PeticaoEntity),
          useValue: mockPeticaoRepository,
        },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
    peticaoRepository = module.get(getRepositoryToken(PeticaoEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveResume', () => {
    it('should save resume successfully when petition exists', async () => {
      // Arrange
      peticaoRepository.findOne.mockResolvedValue(mockPeticaoEntity);
      peticaoRepository.save.mockResolvedValue({
        ...mockPeticaoEntity,
        resumo:
          'TESE JURÍDICA:\nEsta é uma tese jurídica de teste sobre direitos civis.\n\nSOLICITAÇÃO/PEDIDO:\nRequer-se a condenação do réu ao pagamento de indenização por danos morais.',
      });

      // Act
      const result = await service.saveResume(1, mockSummary);

      // Assert
      expect(peticaoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(peticaoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resumo: expect.stringContaining('TESE JURÍDICA:'),
        }),
      );
      expect(result.resumo).toContain('TESE JURÍDICA:');
      expect(result.resumo).toContain('SOLICITAÇÃO/PEDIDO:');
    });

    it('should throw error when petition does not exist', async () => {
      // Arrange
      peticaoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.saveResume(999, mockSummary)).rejects.toThrow(
        'Petição com ID 999 não encontrada',
      );
      expect(peticaoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(peticaoRepository.save).not.toHaveBeenCalled();
    });

    it('should format resume correctly with long content', async () => {
      // Arrange
      const longSummary: PeticaoSummary = {
        teseJuridica: 'A'.repeat(1000), // Very long thesis
        solicitacaoPedido: 'B'.repeat(500), // Very long request
      };

      peticaoRepository.findOne.mockResolvedValue(mockPeticaoEntity);
      peticaoRepository.save.mockResolvedValue({
        ...mockPeticaoEntity,
        resumo: 'formatted resume',
      });

      // Act
      await service.saveResume(1, longSummary);

      // Assert
      expect(peticaoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resumo: expect.stringContaining('TESE JURÍDICA:'),
        }),
      );
    });
  });

  describe('getResume', () => {
    it('should return resume data when petition has resume', async () => {
      // Arrange
      const resumeString =
        'TESE JURÍDICA:\nTest thesis\n\nSOLICITAÇÃO/PEDIDO:\nTest request';
      peticaoRepository.findOne.mockResolvedValue({
        ...mockPeticaoEntity,
        resumo: resumeString,
      });

      // Act
      const result = await service.getResume(1);

      // Assert
      expect(peticaoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'resumo'],
      });
      expect(result).toEqual({
        teseJuridica: 'Test thesis',
        solicitacaoPedido: 'Test request',
        resumoCompleto: resumeString,
      });
    });

    it('should return null when petition does not exist', async () => {
      // Arrange
      peticaoRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getResume(999);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when petition exists but has no resume', async () => {
      // Arrange
      peticaoRepository.findOne.mockResolvedValue({
        ...mockPeticaoEntity,
        resumo: null,
      });

      // Act
      const result = await service.getResume(1);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('formatResume', () => {
    it('should format summary into structured resume string', () => {
      // Arrange
      const summary: PeticaoSummary = {
        teseJuridica: 'Test thesis content',
        solicitacaoPedido: 'Test request content',
      };

      // Act
      const result = (service as any).formatResume(summary);

      // Assert
      expect(result).toBe(
        'TESE JURÍDICA:\nTest thesis content\n\nSOLICITAÇÃO/PEDIDO:\nTest request content',
      );
    });

    it('should handle empty summary', () => {
      // Arrange
      const emptySummary: PeticaoSummary = {
        teseJuridica: '',
        solicitacaoPedido: '',
      };

      // Act
      const result = (service as any).formatResume(emptySummary);

      // Assert
      expect(result).toBe('TESE JURÍDICA:\n\n\nSOLICITAÇÃO/PEDIDO:\n');
    });

    it('should handle summary with special characters', () => {
      // Arrange
      const specialSummary: PeticaoSummary = {
        teseJuridica: 'Tese com caracteres especiais: áéíóú ñ ç',
        solicitacaoPedido: 'Pedido com símbolos: @#$%&*()',
      };

      // Act
      const result = (service as any).formatResume(specialSummary);

      // Assert
      expect(result).toContain('áéíóú ñ ç');
      expect(result).toContain('@#$%&*()');
    });
  });

  describe('parseResume', () => {
    it('should parse well-formed resume string correctly', () => {
      // Arrange
      const resumeString =
        'TESE JURÍDICA:\nParsed thesis content\n\nSOLICITAÇÃO/PEDIDO:\nParsed request content';

      // Act
      const result = (service as any).parseResume(resumeString) as ResumeData;

      // Assert
      expect(result).toEqual({
        teseJuridica: 'Parsed thesis content',
        solicitacaoPedido: 'Parsed request content',
        resumoCompleto: resumeString,
      });
    });

    it('should handle resume with case variations', () => {
      // Arrange
      const resumeString =
        'tese jurídica:\nCase variation test\n\nSOLICITAÇÃO/PEDIDO:\nMixed case test';

      // Act
      const result = (service as any).parseResume(resumeString) as ResumeData;

      // Assert
      expect(result.teseJuridica).toBe('Case variation test');
      expect(result.solicitacaoPedido).toBe('Mixed case test');
    });

    it('should handle resume with extra whitespace', () => {
      // Arrange
      const resumeString =
        'TESE JURÍDICA:\n  Whitespace test  \n\nSOLICITAÇÃO/PEDIDO:\n   Trim test   ';

      // Act
      const result = (service as any).parseResume(resumeString) as ResumeData;

      // Assert
      expect(result.teseJuridica).toBe('Whitespace test');
      expect(result.solicitacaoPedido).toBe('Trim test');
    });

    it('should handle malformed resume - missing thesis', () => {
      // Arrange
      const resumeString = 'SOLICITAÇÃO/PEDIDO:\nOnly request content';

      // Act
      const result = (service as any).parseResume(resumeString) as ResumeData;

      // Assert
      expect(result).toEqual({
        teseJuridica: '',
        solicitacaoPedido: 'Only request content',
        resumoCompleto: resumeString,
      });
    });

    it('should handle malformed resume - missing request', () => {
      // Arrange
      const resumeString = 'TESE JURÍDICA:\nOnly thesis content';

      // Act
      const result = (service as any).parseResume(resumeString) as ResumeData;

      // Assert
      expect(result).toEqual({
        teseJuridica: 'Only thesis content',
        solicitacaoPedido: '',
        resumoCompleto: resumeString,
      });
    });

    it('should handle completely malformed resume', () => {
      // Arrange
      const resumeString = 'No valid sections here';

      // Act
      const result = (service as any).parseResume(resumeString) as ResumeData;

      // Assert
      expect(result).toEqual({
        teseJuridica: '',
        solicitacaoPedido: '',
        resumoCompleto: resumeString,
      });
    });

    it('should handle empty resume string', () => {
      // Arrange
      const resumeString = '';

      // Act
      const result = (service as any).parseResume(resumeString) as ResumeData;

      // Assert
      expect(result).toEqual({
        teseJuridica: '',
        solicitacaoPedido: '',
        resumoCompleto: '',
      });
    });

    it('should handle resume with multiple lines in each section', () => {
      // Arrange
      const resumeString =
        'TESE JURÍDICA:\nLine 1\nLine 2\nLine 3\n\nSOLICITAÇÃO/PEDIDO:\nRequest line 1\nRequest line 2';

      // Act
      const result = (service as any).parseResume(resumeString) as ResumeData;

      // Assert
      expect(result.teseJuridica).toBe('Line 1\nLine 2\nLine 3');
      expect(result.solicitacaoPedido).toBe('Request line 1\nRequest line 2');
    });
  });
});
