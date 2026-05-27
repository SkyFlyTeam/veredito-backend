import { FiltrosDto } from '../../dto/filtros.dto';
import { PeticaoSummary } from '../summary/summary.service';

export interface PipelineInput {
  rawText: string;
  filtros?: FiltrosDto;
  peticaoId?: number;
}

export interface PipelinePrecedentMatch {
  id: number;
  score?: number | string;
  tese?: string;
  questao?: string;
  [key: string]: unknown;
}

export interface PipelineSynthesisResult {
  percentual_similaridade: number;
  classificacao: number;
  sintese_explicativa: string;
  precedente_id: number;
  peticao_id?: number;
  precedente?: PipelinePrecedentMatch;
}

export interface PipelineState {
  input: PipelineInput;
  summary?: PeticaoSummary;
  resume?: string;
  embedding?: number[];
  precedents?: PipelinePrecedentMatch[];
}
