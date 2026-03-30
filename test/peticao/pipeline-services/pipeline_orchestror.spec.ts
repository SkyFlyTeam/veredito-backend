import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { PipelineOrchestrator } from '../../../src/peticao/pipeline-services/pipeline_orchestror';

describe('PipelineOrchestrator', () => {
  let orchestrator: PipelineOrchestrator;
  let mockWordProcessingService: any;
  let mockEmbeddingsService: any;
  let mockSemanticSearchService: any;
  let mockPrecedenteSugeridoService: any;
  let mockPeticaoRepository: any;

  beforeEach(() => {
    mockWordProcessingService = {
      extractTextFromPath: jest.fn(),
    };

    mockEmbeddingsService = {
      generateEmbedding: jest.fn(),
    };

    mockSemanticSearchService = {
      searchSimilar: jest.fn(),
    };

    mockPrecedenteSugeridoService = {
      create: jest.fn(),
    };

    mockPeticaoRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    orchestrator = new PipelineOrchestrator(
      mockWordProcessingService,
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
      const rawText = 'texto   bruto  de   teste';
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockVectorStr = JSON.stringify(mockEmbedding);
      const mockPrecedents = [
        { id: 10, numero_registro: '123', tese: 'tese 1', questao: 'questao 1', score: 0.1 },
        { id: 20, numero_registro: '456', tese: 'tese 2', questao: 'questao 2', score: 0.2 },
      ];

      mockPeticaoRepository.findOne.mockResolvedValueOnce(mockPeticao);
      mockWordProcessingService.extractTextFromPath.mockResolvedValueOnce(rawText);
      mockEmbeddingsService.generateEmbedding.mockResolvedValueOnce(mockEmbedding);
      mockPeticaoRepository.save.mockResolvedValueOnce(undefined);
      mockSemanticSearchService.searchSimilar.mockResolvedValueOnce(mockPrecedents);
      mockPrecedenteSugeridoService.create.mockResolvedValue(undefined);

      const result = await orchestrator.run(1);

      expect(mockWordProcessingService.extractTextFromPath).toHaveBeenCalledWith('caminho/teste.docx');

      expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith('texto bruto de teste');

      expect(mockPeticaoRepository.save).toHaveBeenCalledWith({
        ...mockPeticao,
        resumo: null,
        teseVetor: mockVectorStr,
        questaoVetor: mockVectorStr,
      });

      expect(mockSemanticSearchService.searchSimilar).toHaveBeenCalledWith(mockEmbedding);

      expect(mockPrecedenteSugeridoService.create).toHaveBeenCalledTimes(2);
      expect(mockPrecedenteSugeridoService.create).toHaveBeenNthCalledWith(1, {
        percentual_similaridade: 90, // (1 - 0.1) * 100
        classificacao: 1,
        sintese_explicativa: '',
        precedente_id: 10,
        peticao_id: 1,
      });
      expect(mockPrecedenteSugeridoService.create).toHaveBeenNthCalledWith(2, {
        percentual_similaridade: 80, // (1 - 0.2) * 100
        classificacao: 2,
        sintese_explicativa: '',
        precedente_id: 20,
        peticao_id: 1,
      });

      expect(result).toEqual({
        peticaoId: 1,
        resumo: null,
        precedentes: [
          { id: 10, numero_registro: '123', tese: 'tese 1', questao: 'questao 1', score: 0.1 },
          { id: 20, numero_registro: '456', tese: 'tese 2', questao: 'questao 2', score: 0.2 },
        ]
      });
    });
  });
});
