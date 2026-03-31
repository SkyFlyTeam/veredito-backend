import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { PipelineOrchestrator } from '../../../src/peticao/pipeline-services/pipeline_orchestror';

describe('PipelineOrchestrator', () => {
  let orchestrator: PipelineOrchestrator;
  let mockWordProcessingService: any;
  let mockTextProcessingService: any;
  let mockEmbeddingsService: any;
  let mockSemanticSearchService: any;
  let mockPrecedenteSugeridoService: any;
  let mockPeticaoRepository: any;

  beforeEach(() => {
    mockWordProcessingService = {
      extractTextFromPath: jest.fn(),
    };

    mockTextProcessingService = {
      process: jest.fn(),
    };

    mockEmbeddingsService = {
      generateEmbedding: jest.fn(),
    };

    mockSemanticSearchService = {
      searchSimilar: jest.fn(),
    };

    mockPrecedenteSugeridoService = {
      createBulk: jest.fn(),
    };

    mockPeticaoRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    orchestrator = new PipelineOrchestrator(
      mockWordProcessingService,
      mockTextProcessingService,
      mockEmbeddingsService,
      mockSemanticSearchService,
      mockPrecedenteSugeridoService,
      mockPeticaoRepository,
    );
  });

  describe('run', () => {
    it('deve lançar NotFoundException se a petição não for encontrada', async () => {
      mockPeticaoRepository.findOne.mockResolvedValueOnce(null);

      await expect(orchestrator.run(1)).rejects.toThrow(NotFoundException);
      expect(mockPeticaoRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('deve lançar Error se a extração de texto falhar', async () => {
      mockPeticaoRepository.findOne.mockResolvedValueOnce({ id: 1, caminhoArquivo: 'caminho/teste.docx' });
      mockWordProcessingService.extractTextFromPath.mockResolvedValueOnce(null);

      await expect(orchestrator.run(1)).rejects.toThrow('Falha ao extrair texto do arquivo da petição.');
    });

    it('deve executar o pipeline completo com sucesso', async () => {
      const mockPeticao = { id: 1, caminhoArquivo: 'caminho/teste.docx' };
      const rawText = 'texto bruto de teste';
      const processedText = 'texto bruto teste';
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockVectorStr = JSON.stringify(mockEmbedding);
      const mockPrecedents = [
        { id: 10, numero_registro: '123', score: 0.1 },
        { id: 20, numero_registro: '456', score: 0.2 },
      ];

      mockPeticaoRepository.findOne.mockResolvedValueOnce(mockPeticao);
      mockWordProcessingService.extractTextFromPath.mockResolvedValueOnce(rawText);
      mockTextProcessingService.process.mockReturnValueOnce(processedText);
      mockEmbeddingsService.generateEmbedding.mockResolvedValueOnce(mockEmbedding);
      mockPeticaoRepository.save.mockResolvedValueOnce(undefined);
      mockSemanticSearchService.searchSimilar.mockResolvedValueOnce(mockPrecedents);
      mockPrecedenteSugeridoService.createBulk.mockResolvedValue(undefined);

      const result = await orchestrator.run(1);

      expect(mockWordProcessingService.extractTextFromPath).toHaveBeenCalledWith('caminho/teste.docx');
      expect(mockTextProcessingService.process).toHaveBeenCalledWith(rawText);
      expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith(processedText);

      expect(mockPeticaoRepository.save).toHaveBeenCalledWith({
        ...mockPeticao,
        resumo: null,
        teseVetor: mockEmbedding,
        questaoVetor: mockEmbedding,
      });

      expect(mockSemanticSearchService.searchSimilar).toHaveBeenCalledWith(mockEmbedding);

      expect(mockPrecedenteSugeridoService.createBulk).toHaveBeenCalledWith([
        {
          percentual_similaridade: 90,
          classificacao: 1,
          sintese_explicativa: '',
          precedente_id: 10,
          peticao_id: 1,
        },
        {
          percentual_similaridade: 80,
          classificacao: 2,
          sintese_explicativa: '',
          precedente_id: 20,
          peticao_id: 1,
        },
      ]);

      expect(result).toEqual({
        peticaoId: 1,
        resumo: null,
        precedentes: [],
      });
    });
  });
});
