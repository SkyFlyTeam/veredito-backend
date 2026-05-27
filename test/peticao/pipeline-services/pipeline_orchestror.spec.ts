import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));
import { NotFoundException } from '@nestjs/common';
import { PipelineOrchestrator } from '../../../src/peticao/pipeline-services/pipeline_orchestror';
import { ClassificacaoAderencia } from '../../../src/precedents/enumerator/classificacao-aderencia.enumerator';

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

  let mockPersistence: any;
  let mockExtractFileTextStep: any;
  let mockGenerateSummaryStep: any;
  let mockBuildSummaryTextStep: any;
  let mockGenerateEmbeddingStep: any;
  let mockSearchPrecedentsStep: any;
  let mockGenerateSynthesisStep: any;

  const mockSummary = {
    teseJuridica: 'test thesis',
    solicitacaoPedido: 'test request',
  };

  const mockResume =
    'TESE JURÍDICA:\ntest thesis\n\nSOLICITAÇÃO/PEDIDO:\ntest request';

  beforeEach(() => {
    mockPersistence = {
      findPeticaoOrFail: jest.fn(),
      savePeticaoAnalysis: jest.fn(),
      saveInitialSuggestions: jest.fn(),
      saveSynthesis: jest.fn(),
    };

    mockExtractFileTextStep = {
      execute: jest.fn(),
    };

    mockGenerateSummaryStep = {
      execute: jest.fn(),
      format: jest.fn(),
    };

    mockBuildSummaryTextStep = {
      fromSummary: jest.fn(),
    };

    mockGenerateEmbeddingStep = {
      execute: jest.fn(),
    };

    mockSearchPrecedentsStep = {
      execute: jest.fn(),
      getAverageSimilarityScore: jest.fn(),
    };

    mockGenerateSynthesisStep = {
      execute: jest.fn(),
    };

    orchestrator = new PipelineOrchestrator(
      mockPersistence,
      mockExtractFileTextStep,
      mockGenerateSummaryStep,
      mockBuildSummaryTextStep,
      mockGenerateEmbeddingStep,
      mockSearchPrecedentsStep,
      mockGenerateSynthesisStep,
    );
  });

  function arrangeSuccessfulSteps() {
    const mockPeticao = {
      id: 1,
      caminhoArquivo: 'caminho/teste.docx',
    };
    const rawText = 'texto bruto de teste';
    const sourceText = 'test thesis test request';
    const embedding = [0.1, 0.2, 0.3];
    const precedents = [
      { id: 10, numero_registro: '123', score: 0.1, tese: 'tese 1' },
      { id: 20, numero_registro: '456', score: 0.2, tese: 'tese 2' },
    ];
    const syntheses = [
      {
        percentual_similaridade: 55,
        classificacao: ClassificacaoAderencia.APLICAVEL,
        sintese_explicativa: 'síntese 1',
        precedente_id: 10,
        peticao_id: 1,
        precedente: precedents[0],
      },
      {
        percentual_similaridade: 60,
        classificacao: ClassificacaoAderencia.NAO_APLICAVEL,
        sintese_explicativa: 'síntese 2',
        precedente_id: 20,
        peticao_id: 1,
        precedente: precedents[1],
      },
    ];
    const savedSyntheses = [
      { id: 1, ...syntheses[0] },
      { id: 2, ...syntheses[1] },
    ];

    mockPersistence.findPeticaoOrFail.mockResolvedValue(mockPeticao);
    mockExtractFileTextStep.execute.mockResolvedValue(rawText);
    mockGenerateSummaryStep.execute.mockResolvedValue(mockSummary);
    mockGenerateSummaryStep.format.mockReturnValue(mockResume);
    mockBuildSummaryTextStep.fromSummary.mockReturnValue(sourceText);
    mockGenerateEmbeddingStep.execute.mockResolvedValue(embedding);
    mockSearchPrecedentsStep.execute.mockResolvedValue(precedents);
    mockSearchPrecedentsStep.getAverageSimilarityScore.mockReturnValue(0.15);
    mockGenerateSynthesisStep.execute
      .mockResolvedValueOnce(syntheses[0])
      .mockResolvedValueOnce(syntheses[1]);
    mockPersistence.saveSynthesis
      .mockResolvedValueOnce(savedSyntheses[0])
      .mockResolvedValueOnce(savedSyntheses[1]);

    return {
      mockPeticao,
      rawText,
      sourceText,
      embedding,
      precedents,
      syntheses,
      savedSyntheses,
    };
  }

  describe('run', () => {
    it('deve emitir ErrorEvent se a petição não for encontrada', async () => {
      mockPersistence.findPeticaoOrFail.mockRejectedValueOnce(
        new NotFoundException('Petição com ID 1 não encontrada'),
      );

      const events = await collectEvents(orchestrator.run(1));
      const errorEvent = events.find((event) => event.stage === 'error');

      expect(errorEvent).toBeDefined();
      expect(errorEvent.status).toBe('error');
      expect(errorEvent.data.message).toContain(
        'Petição com ID 1 não encontrada',
      );
      expect(mockPersistence.findPeticaoOrFail).toHaveBeenCalledWith(1);
      expect(mockExtractFileTextStep.execute).not.toHaveBeenCalled();
    });

    it('deve emitir ErrorEvent se a extração de texto falhar', async () => {
      mockPersistence.findPeticaoOrFail.mockResolvedValueOnce({
        id: 1,
        caminhoArquivo: 'caminho/teste.docx',
      });
      mockExtractFileTextStep.execute.mockRejectedValueOnce(
        new Error('Falha ao extrair texto do arquivo da petição.'),
      );

      const events = await collectEvents(orchestrator.run(1));
      const errorEvent = events.find((event) => event.stage === 'error');

      expect(errorEvent).toBeDefined();
      expect(errorEvent.status).toBe('error');
      expect(errorEvent.data.message).toContain('Falha ao extrair texto');
      expect(mockExtractFileTextStep.execute).toHaveBeenCalledWith(
        'caminho/teste.docx',
      );
    });

    it('deve executar o pipeline de petição com resumo, busca e sínteses', async () => {
      const {
        mockPeticao,
        rawText,
        sourceText,
        embedding,
        precedents,
        savedSyntheses,
      } = arrangeSuccessfulSteps();

      const events = await collectEvents(orchestrator.run(1));

      expect(mockPersistence.findPeticaoOrFail).toHaveBeenCalledWith(1);
      expect(mockExtractFileTextStep.execute).toHaveBeenCalledWith(
        'caminho/teste.docx',
      );
      expect(mockGenerateSummaryStep.execute).toHaveBeenCalledWith(rawText);
      expect(mockGenerateSummaryStep.format).toHaveBeenCalledWith(mockSummary);
      expect(mockBuildSummaryTextStep.fromSummary).toHaveBeenCalledWith(
        mockSummary,
      );
      expect(mockGenerateEmbeddingStep.execute).toHaveBeenCalledWith(
        sourceText,
      );
      expect(mockPersistence.savePeticaoAnalysis).toHaveBeenCalledWith(
        mockPeticao,
        mockResume,
        embedding,
      );
      expect(mockSearchPrecedentsStep.execute).toHaveBeenCalledWith(
        embedding,
        undefined,
      );
      expect(mockPersistence.saveInitialSuggestions).toHaveBeenCalledWith(
        1,
        precedents,
      );
      expect(mockGenerateSynthesisStep.execute).toHaveBeenNthCalledWith(
        1,
        sourceText,
        precedents[0],
        1,
      );
      expect(mockGenerateSynthesisStep.execute).toHaveBeenNthCalledWith(
        2,
        sourceText,
        precedents[1],
        1,
      );

      const resumoEvent = events.find((event) => event.stage === 'resumo');
      const searchEvent = events.find((event) => event.stage === 'search');
      const synthesisEvents = events.filter(
        (event) => event.stage === 'synthesis',
      );
      const completeEvent = events.find((event) => event.stage === 'complete');

      expect(resumoEvent.data.resumo).toBe(mockResume);
      expect(searchEvent.data).toMatchObject({
        precedents,
        totalFound: 2,
        averageSimilarityScore: 0.15,
      });
      expect(synthesisEvents).toHaveLength(2);
      expect(synthesisEvents[0].data).toEqual(savedSyntheses[0]);
      expect(synthesisEvents[1].data).toEqual(savedSyntheses[1]);
      expect(completeEvent.data).toMatchObject({
        precedentsProcessed: 2,
        synthesisGenerated: 2,
      });
    });
  });

  describe('runProcesso', () => {
    it('deve emitir apenas synthesis e complete para texto de processo', async () => {
      const { sourceText, embedding, precedents, syntheses } =
        arrangeSuccessfulSteps();

      const events = await collectEvents(
        orchestrator.runProcesso('texto processo'),
      );

      expect(mockExtractFileTextStep.execute).not.toHaveBeenCalled();
      expect(mockPersistence.savePeticaoAnalysis).not.toHaveBeenCalled();
      expect(mockPersistence.saveInitialSuggestions).not.toHaveBeenCalled();
      expect(mockPersistence.saveSynthesis).not.toHaveBeenCalled();
      expect(mockGenerateSummaryStep.execute).toHaveBeenCalledWith(
        'texto processo',
      );
      expect(mockGenerateEmbeddingStep.execute).toHaveBeenCalledWith(
        sourceText,
      );
      expect(mockSearchPrecedentsStep.execute).toHaveBeenCalledWith(
        embedding,
        undefined,
      );
      expect(mockGenerateSynthesisStep.execute).toHaveBeenCalledWith(
        sourceText,
        precedents[0],
        undefined,
      );

      expect(events.map((event) => event.stage)).toEqual([
        'synthesis',
        'synthesis',
        'complete',
      ]);
      expect(events[0].data).toEqual(syntheses[0]);
    });
  });

  describe('runCasoJuridico', () => {
    it('deve emitir synthesis apenas para precedentes aplicáveis', async () => {
      const { syntheses } = arrangeSuccessfulSteps();

      const events = await collectEvents(
        orchestrator.runCasoJuridico('texto caso'),
      );
      const synthesisEvents = events.filter(
        (event) => event.stage === 'synthesis',
      );
      const completeEvent = events.find((event) => event.stage === 'complete');

      expect(events.map((event) => event.stage)).toEqual([
        'synthesis',
        'complete',
      ]);
      expect(synthesisEvents).toHaveLength(1);
      expect(synthesisEvents[0].data).toEqual(syntheses[0]);
      expect(completeEvent.data).toMatchObject({
        precedentsProcessed: 2,
        synthesisGenerated: 1,
      });
    });
  });
});
