import { PrecedenteSugeridoEntity } from '../../precedents/entity/precedente_sugerido.entity';

export interface PipelineEvent {
  stage: 'search' | 'synthesis' | 'resumo' | 'complete' | 'error';
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
  duration?: number;
  data: any;
}

export interface SearchEvent extends PipelineEvent {
  stage: 'search';
  data: {
    precedents: PrecedenteSugeridoEntity[];
    totalFound: number;
    averageSimilarityScore: number;
  };
}

export interface SynthesisEvent extends PipelineEvent {
  stage: 'synthesis';
  data: PrecedenteSugeridoEntity;
}

export interface ResumoEvent extends PipelineEvent {
  stage: 'resumo';
  data: {
    resumo: string;
  };
}

export interface CompleteEvent extends PipelineEvent {
  stage: 'complete';
  status: 'success';
  data: {
    totalDurationMs: number;
    precedentsProcessed: number;
    synthesisGenerated: number;
  };
}

export interface ErrorEvent extends PipelineEvent {
  stage: 'error';
  status: 'error';
  data: {
    failedStage: 'search' | 'synthesis' | 'resumo' | 'unknown';
    message: string;
    errorCode: string;
    precedentId?: number;
    recoverable: boolean;
    suggestedAction?: string;
  };
}
