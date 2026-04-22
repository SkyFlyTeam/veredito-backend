
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
    precedents: PrecedentData[];
    totalFound: number;
    averageSimilarityScore: number;
  };
}


export interface PrecedentData {
  id: number;
  numero_registro: string;
  tese: string;
  questao: string;
  percentual_similaridade: number;
  tribunal?: string;
}


export interface SynthesisEvent extends PipelineEvent {
  stage: 'synthesis';
  data: {
    precedentId: number;
    percentual_similaridade: number;
    classificacao: number;
    sintese_explicativa: string;
  };
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
