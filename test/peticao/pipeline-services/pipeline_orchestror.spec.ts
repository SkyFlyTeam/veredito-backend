import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PipelineOrchestrator } from '../../../src/peticao/pipeline-services/pipeline_orchestror';

function collectEvents(observable: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const events: any[] = [];

    observable.subscribe({
      next: (event: any) => events.push(event),
      error: reject,
      complete: () => resolve(events),
    });
  });
}

describe('PipelineOrchestrator', () => {
  let orchestrator: PipelineOrchestrator;

  let mockWordProcessingService: any;
  let mockTextProcessingService: any;
  let mockEmbeddingsService: any;
  let mockSemanticSearchService: any;
  let mockPrecedenteSugeridoService: any;
  let mockSynthesisService: any;
  let mockSummaryService: any;
  let mockResumeService: any;
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

    mockSynthesisService = {
      generateSynthesis: jest.fn(),
    };

    mockSummaryService = {
      summarize: jest.fn(),
    };

    mockResumeService = {
      saveResume: jest.fn(),
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
      mockSynthesisService,
      mockSummaryService,
      mockResumeService,
      mockPeticaoRepository,
    );
  });

  describe('run', () => {
    it('deve emitir ErrorEvent se a petição não for encontrada', async () => {
      mockPeticaoRepository.findOne.mockResolvedValueOnce(null);

      const events = await collectEvents(orchestrator.run(1));

      const errorEvent = events.find((event) => event.stage === 'error');

      expect(errorEvent).toBeDefined();
      expect(errorEvent.status).toBe('error');
      expect(errorEvent.data.message).toContain(
        'Petição com ID 1 não encontrada',
      );

      expect(mockPeticaoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve emitir ErrorEvent se a extração de texto falhar', async () => {
      mockPeticaoRepository.findOne.mockResolvedValueOnce({
        id: 1,
        caminhoArquivo: 'caminho/teste.docx',
      });

      mockWordProcessingService.extractTextFromPath.mockResolvedValueOnce(null);

      const events = await collectEvents(orchestrator.run(1));

      const errorEvent = events.find((event) => event.stage === 'error');

      expect(errorEvent).toBeDefined();
      expect(errorEvent.status).toBe('error');
      expect(errorEvent.data.message).toContain('Falha ao extrair texto');

      expect(mockWordProcessingService.extractTextFromPath).toHaveBeenCalledWith(
        'caminho/teste.docx',
      );
    });

    it('deve executar o pipeline completo com sucesso', async () => {
      const mockPeticao = {
        id: 1,
        caminhoArquivo: 'caminho/teste.docx',
      };

      const rawText = 'texto bruto de teste';
      const processedText = 'texto bruto teste';

      const mockSummary = {
        teseJuridica: 'test thesis',
        solicitacaoPedido: 'test request',
      };

      const mockPeticaoComResumo = {
        ...mockPeticao,
        resumo:
          'TESE JURÍDICA:\ntest thesis\n\nSOLICITAÇÃO/PEDIDO:\ntest request',
      };

      const mockEmbedding = [0.1, 0.2, 0.3];

      const mockPrecedents = [
        {
          id: 10,
          numero_registro: '123',
          score: 0.1,
          tese: 'tese 1',
        },
        {
          id: 20,
          numero_registro: '456',
          score: 0.2,
          tese: 'tese 2',
        },
      ];

      const savedSynthesisOne = {
        id: 1,
        percentual_similaridade: 55,
        classificacao: 'aplicável',
        sintese_explicativa: 'síntese 1',
        precedente_id: 10,
        peticao_id: 1,
      };

      const savedSynthesisTwo = {
        id: 2,
        percentual_similaridade: 60,
        classificacao: 'não aplicável',
        sintese_explicativa: 'síntese 2',
        precedente_id: 20,
        peticao_id: 1,
      };

      mockPeticaoRepository.findOne.mockResolvedValueOnce(mockPeticao);
      mockWordProcessingService.extractTextFromPath.mockResolvedValueOnce(
        rawText,
      );
      mockSummaryService.summarize.mockResolvedValueOnce(mockSummary);
      mockResumeService.saveResume.mockResolvedValueOnce(mockPeticaoComResumo);
      mockTextProcessingService.process.mockReturnValueOnce(processedText);
      mockEmbeddingsService.generateEmbedding.mockResolvedValueOnce(
        mockEmbedding,
      );
      mockPeticaoRepository.save.mockResolvedValueOnce(undefined);
      mockSemanticSearchService.searchSimilar.mockResolvedValueOnce(
        mockPrecedents,
      );

      mockPrecedenteSugeridoService.createBulk
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([savedSynthesisOne])
        .mockResolvedValueOnce([savedSynthesisTwo]);

      mockSynthesisService.generateSynthesis
        .mockResolvedValueOnce({
          classificacao: 'aplicável',
          sintese: 'síntese 1',
        })
        .mockResolvedValueOnce({
          classificacao: 'não aplicável',
          sintese: 'síntese 2',
        });

      const events = await collectEvents(orchestrator.run(1));

      expect(mockPeticaoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockWordProcessingService.extractTextFromPath).toHaveBeenCalledWith(
        'caminho/teste.docx',
      );

      expect(mockSummaryService.summarize).toHaveBeenCalledWith(rawText);

      expect(mockResumeService.saveResume).toHaveBeenCalledWith(1, mockSummary);

      expect(mockTextProcessingService.process).toHaveBeenCalledWith(rawText);

      expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith(
        `${mockSummary.teseJuridica}\n${mockSummary.solicitacaoPedido}`
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000),
      );

      expect(mockPeticaoRepository.save).toHaveBeenCalledWith({
        ...mockPeticao,
        teseVetor: mockEmbedding,
        questaoVetor: mockEmbedding,
      });

      expect(mockSemanticSearchService.searchSimilar).toHaveBeenCalledWith(
        mockEmbedding,
      );

      expect(mockPrecedenteSugeridoService.createBulk).toHaveBeenNthCalledWith(
        1,
        [
          {
            percentual_similaridade: 55,
            classificacao: 1,
            sintese_explicativa: '',
            precedente_id: 10,
            peticao_id: 1,
          },
          {
            percentual_similaridade: 60,
            classificacao: 2,
            sintese_explicativa: '',
            precedente_id: 20,
            peticao_id: 1,
          },
        ],
      );

      expect(mockSynthesisService.generateSynthesis).toHaveBeenNthCalledWith(
        1,
        'test thesis\ntest request',
        'tese 1',
      );

      expect(mockSynthesisService.generateSynthesis).toHaveBeenNthCalledWith(
        2,
        'test thesis\ntest request',
        'tese 2',
      );

      const resumoEvent = events.find((event) => event.stage === 'resumo');
      const searchEvent = events.find((event) => event.stage === 'search');
      const synthesisEvents = events.filter(
        (event) => event.stage === 'synthesis',
      );
      const completeEvent = events.find((event) => event.stage === 'complete');

      expect(resumoEvent).toBeDefined();
      expect(resumoEvent.status).toBe('success');
      expect(resumoEvent.data.resumo).toBe(mockPeticaoComResumo.resumo);

      expect(searchEvent).toBeDefined();
      expect(searchEvent.status).toBe('success');
      expect(searchEvent.data.totalFound).toBe(2);

      expect(synthesisEvents).toHaveLength(2);
      expect(synthesisEvents[0].data).toEqual(savedSynthesisOne);
      expect(synthesisEvents[1].data).toEqual(savedSynthesisTwo);

      expect(completeEvent).toBeDefined();
      expect(completeEvent.status).toBe('success');
      expect(completeEvent.data.precedentsProcessed).toBe(2);
      expect(completeEvent.data.synthesisGenerated).toBe(2);
    });
  });
});
