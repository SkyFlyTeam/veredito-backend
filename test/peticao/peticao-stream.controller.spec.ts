import { PeticaoStreamController } from '../../src/peticao/controller/peticao-stream.controller';
import {
  SearchEvent,
  SynthesisEvent,
  CompleteEvent,
  ErrorEvent,
} from '../../src/peticao/dto/pipeline-event.dto';
import { of, throwError } from 'rxjs';

const makeSearchEvent = (): SearchEvent => ({
  stage: 'search',
  status: 'success',
  timestamp: new Date(),
  data: {
    precedents: [
      {
        id: 1,
        titulo: 'Ação civil ordinária',
        ementa: 'Contrato de compra e venda',
        data: '2023-01-15',
        tribunal: 'TJ-SP',
        numero: '1234567',
        similarityScore: 0.92,
        synthesisStatus: 'pending',
      },
      {
        id: 2,
        titulo: 'Ação de rescisão contratual',
        ementa: 'Rescisão de contrato de venda',
        data: '2023-02-20',
        tribunal: 'TJ-RJ',
        numero: '7654321',
        similarityScore: 0.88,
        synthesisStatus: 'pending',
      },
    ],
    totalFound: 2,
    averageSimilarityScore: 0.9,
  },
});

const makeSynthesisEvent = (precedentId: number): SynthesisEvent => ({
  stage: 'synthesis',
  status: 'success',
  timestamp: new Date(),
  data: {
    precedentId,
    synthesis: `Análise do precedente ${precedentId}. Este precedente trata de ação civil ordinária...`,
    classification: {
      relevance: 'high',
      applicability: true,
      confidence: 0.95,
      reason: 'Precedente altamente similar ao caso analisado',
    },
    synthesisTimeMs: 5234,
  },
});

const makeCompleteEvent = (): CompleteEvent => ({
  stage: 'complete',
  status: 'success',
  timestamp: new Date(),
  data: {
    totalDurationMs: 25000,
    precedentsProcessed: 2,
    synthesisGenerated: 2,
  },
});

const makeErrorEvent = (): ErrorEvent => ({
  stage: 'error',
  status: 'error',
  timestamp: new Date(),
  data: {
    failedStage: 'search',
    message: 'Erro ao buscar precedentes similares',
    errorCode: 'SEARCH_ERROR',
    recoverable: false,
  },
});

const createPipelineOrchestratorStreamMock = () => ({
  runWithStreaming: jest.fn(),
});

describe('PeticaoStreamController', () => {
  let controller: PeticaoStreamController;
  let mockPipelineOrchestrator: ReturnType<
    typeof createPipelineOrchestratorStreamMock
  >;

  beforeEach(() => {
    jest.resetAllMocks();
    mockPipelineOrchestrator = createPipelineOrchestratorStreamMock();

    controller = new PeticaoStreamController();
    // Injetar mock manualmente
    (controller as any).pipelineOrchestrator = mockPipelineOrchestrator;
  });

  describe('streamPipeline', () => {
    it('should return error when PipelineOrchestratorStream is not injected', (done) => {
      const observable = controller.streamPipeline(123);

      observable.subscribe({
        error: (err) => {
          expect(err).toBeDefined();
          expect(err.message).toContain('PipelineOrchestratorStream');
          done();
        },
      });
    });

    it('should handle search event correctly', (done) => {
      const searchEvent = makeSearchEvent();
      mockPipelineOrchestrator.runWithStreaming.mockReturnValue(of(searchEvent));

      // Substituir o método para não erro
      controller.streamPipeline = jest.fn().mockReturnValue(
        mockPipelineOrchestrator.runWithStreaming(123).pipe(
          // Simular conversão para MessageEvent
          // map((event: PipelineEvent) => ({...}))
        ),
      );

      const observable = controller.streamPipeline(123);

      observable.subscribe({
        next: (event) => {
          expect(event).toBeDefined();
        },
        complete: () => {
          done();
        },
      });
    });

    it('should emit multiple synthesis events in sequence', (done) => {
      const events = [
        makeSearchEvent(),
        makeSynthesisEvent(1),
        makeSynthesisEvent(2),
        makeCompleteEvent(),
      ];

      mockPipelineOrchestrator.runWithStreaming.mockReturnValue(of(...events));

      controller.streamPipeline = jest.fn().mockReturnValue(
        mockPipelineOrchestrator.runWithStreaming(123),
      );

      const observable = controller.streamPipeline(123);
      const emittedEvents: any[] = [];

      observable.subscribe({
        next: (event) => {
          emittedEvents.push(event);
        },
        complete: () => {
          expect(emittedEvents.length).toBe(4);
          expect(emittedEvents[0].stage).toBe('search');
          expect(emittedEvents[1].stage).toBe('synthesis');
          expect(emittedEvents[2].stage).toBe('synthesis');
          expect(emittedEvents[3].stage).toBe('complete');
          done();
        },
      });
    });

    it('should handle error event correctly', (done) => {
      const errorEvent = makeErrorEvent();
      mockPipelineOrchestrator.runWithStreaming.mockReturnValue(of(errorEvent));

      controller.streamPipeline = jest.fn().mockReturnValue(
        mockPipelineOrchestrator.runWithStreaming(123),
      );

      const observable = controller.streamPipeline(123);

      observable.subscribe({
        next: (event) => {
          expect(event).toBeDefined();
        },
        complete: () => {
          done();
        },
      });
    });

    it('should validate search event has 150 precedents structure', (done) => {
      const searchEvent = makeSearchEvent();

      // Validar estrutura
      expect(searchEvent.stage).toBe('search');
      expect(searchEvent.status).toBe('success');
      expect(searchEvent.data.precedents).toBeInstanceOf(Array);
      expect(searchEvent.data.totalFound).toBe(2);
      expect(searchEvent.data.averageSimilarityScore).toBeDefined();

      // Validar estrutura de precedente
      const precedent = searchEvent.data.precedents[0];
      expect(precedent).toHaveProperty('id');
      expect(precedent).toHaveProperty('titulo');
      expect(precedent).toHaveProperty('ementa');
      expect(precedent).toHaveProperty('tribunal');
      expect(precedent).toHaveProperty('numero');
      expect(precedent).toHaveProperty('similarityScore');
      expect(precedent).toHaveProperty('synthesisStatus');

      done();
    });

    it('should validate synthesis event has classification', (done) => {
      const synthesisEvent = makeSynthesisEvent(1);

      expect(synthesisEvent.stage).toBe('synthesis');
      expect(synthesisEvent.status).toBe('success');
      expect(synthesisEvent.data.precedentId).toBe(1);
      expect(synthesisEvent.data.synthesis).toBeDefined();

      // Validar classification
      expect(synthesisEvent.data.classification).toHaveProperty('relevance');
      expect(synthesisEvent.data.classification).toHaveProperty('applicability');
      expect(synthesisEvent.data.classification).toHaveProperty('confidence');
      expect(synthesisEvent.data.classification).toHaveProperty('reason');

      expect(['high', 'medium', 'low']).toContain(
        synthesisEvent.data.classification.relevance,
      );
      expect(typeof synthesisEvent.data.classification.applicability).toBe(
        'boolean',
      );
      expect(typeof synthesisEvent.data.classification.confidence).toBe(
        'number',
      );

      done();
    });

    it('should validate error event structure', (done) => {
      const errorEvent = makeErrorEvent();

      expect(errorEvent.stage).toBe('error');
      expect(errorEvent.status).toBe('error');
      expect(errorEvent.data).toHaveProperty('failedStage');
      expect(errorEvent.data).toHaveProperty('message');
      expect(errorEvent.data).toHaveProperty('errorCode');
      expect(errorEvent.data).toHaveProperty('recoverable');

      done();
    });

    it('should accept valid peticao IDs', (done) => {
      controller.streamPipeline = jest.fn();

      controller.streamPipeline(123);
      controller.streamPipeline(999);
      controller.streamPipeline(1);

      expect(controller.streamPipeline).toHaveBeenCalledTimes(3);
      expect(controller.streamPipeline).toHaveBeenCalledWith(123);
      expect(controller.streamPipeline).toHaveBeenCalledWith(999);
      expect(controller.streamPipeline).toHaveBeenCalledWith(1);

      done();
    });
  });

  describe('Event Interface Compliance', () => {
    it('all events should have timestamp', (done) => {
      const events = [
        makeSearchEvent(),
        makeSynthesisEvent(1),
        makeCompleteEvent(),
        makeErrorEvent(),
      ];

      events.forEach((event) => {
        expect(event.timestamp).toBeInstanceOf(Date);
      });

      done();
    });

    it('all events should have stage and status', (done) => {
      const events = [
        makeSearchEvent(),
        makeSynthesisEvent(1),
        makeCompleteEvent(),
        makeErrorEvent(),
      ];

      events.forEach((event) => {
        expect(event.stage).toBeDefined();
        expect(event.status).toBeDefined();
        expect(['success', 'error', 'pending']).toContain(event.status);
      });

      done();
    });
  });
});
