/**
 * Estrutura de eventos SSE para streaming da pipeline
 *
 * Cada evento emitido pela pipeline durante a execução
 * É tipado com essas interfaces para garantir consistência
 * no envio ao frontend via Server-Sent Events
 */

/**
 * Interface base para todos os eventos SSE
 */
export interface PipelineEvent {
  /**
   * Nome da etapa que gerou o evento
   */
  stage:
    | 'extraction'
    | 'nlp'
    | 'embedding'
    | 'search'
    | 'synthesis'
    | 'summary'
    | 'complete'
    | 'error';

  /**
   * Status do evento
   */
  status: 'success' | 'error' | 'pending';

  /**
   * Timestamp de quando o evento foi gerado
   */
  timestamp: Date;

  /**
   * Duração em ms desde o início
   */
  duration?: number;

  /**
   * Dados específicos do evento
   */
  data: any;
}

/**
 * Evento 1: Extração de texto da petição
 */
export interface ExtractionEvent extends PipelineEvent {
  stage: 'extraction';
  data: {
    extractedText: string;
    textLength: number;
    fileType: string;
  };
}

/**
 * Evento 2: Processamento NLP
 */
export interface NlpEvent extends PipelineEvent {
  stage: 'nlp';
  data: {
    processedTokens: number;
    cleanedText: string;
  };
}

/**
 * Evento 3: Geração de embeddings
 */
export interface EmbeddingEvent extends PipelineEvent {
  stage: 'embedding';
  data: {
    embeddingDimension: number;
    embeddingGenerated: boolean;
  };
}

/**
 * Evento 4: Busca de precedentes (150 precedentes iniciais)
 * ✅ CRITÉRIO: Envio inicial de todos os 150 precedentes
 */
export interface SearchEvent extends PipelineEvent {
  stage: 'search';
  data: {
    precedents: PrecedentData[];
    totalFound: number;
    averageSimilarityScore: number;
  };
}

/**
 * Estrutura de cada precedente encontrado
 */
export interface PrecedentData {
  id: number;
  titulo: string;
  ementa: string;
  data: string;
  tribunal: string;
  numero: string;
  similarityScore: number;
  synthesisStatus: 'pending' | 'processing' | 'completed' | 'error';
}

/**
 * Evento 5: Síntese de um precedente (progressivo - múltiplos)
 * ✅ CRITÉRIO: Envio de sínteses e classificações de cada precedente
 */
export interface SynthesisEvent extends PipelineEvent {
  stage: 'synthesis';
  data: {
    precedentId: number;
    synthesis: string;
    classification: {
      relevance: 'high' | 'medium' | 'low';
      applicability: boolean;
      confidence: number;
      reason: string;
    };
    synthesisTimeMs: number;
  };
}

/**
 * Evento 6: Resumo final
 * ✅ CRITÉRIO: Envio do resumo
 */
export interface SummaryEvent extends PipelineEvent {
  stage: 'summary';
  data: {
    totalAnalyzed: number;
    highRelevance: number;
    mediumRelevance: number;
    lowRelevance: number;
    recommendations: {
      title: string;
      description: string;
      precedentIds: number[];
    }[];
    totalProcessingTimeMs: number;
  };
}

/**
 * Evento 7: Pipeline concluída com sucesso
 */
export interface CompleteEvent extends PipelineEvent {
  stage: 'complete';
  status: 'success';
  data: {
    totalDurationMs: number;
    precedentsProcessed: number;
    synthesisGenerated: number;
  };
}

/**
 * Evento 8: Erro em qualquer etapa
 * ✅ CRITÉRIO: Incluir caso de erro de envio
 */
export interface ErrorEvent extends PipelineEvent {
  stage: 'error';
  status: 'error';
  data: {
    failedStage:
      | 'extraction'
      | 'nlp'
      | 'embedding'
      | 'search'
      | 'synthesis'
      | 'summary'
      | 'unknown';
    message: string;
    errorCode: string;
    precedentId?: number;
    recoverable: boolean;
    suggestedAction?: string;
  };
}
