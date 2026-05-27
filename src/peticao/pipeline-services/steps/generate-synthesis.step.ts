import { Injectable } from '@nestjs/common';
import { SynthesisService } from '../../../synthesis/synthesis.service';
import {
  PipelinePrecedentMatch,
  PipelineSynthesisResult,
} from '../types/pipeline-types';

@Injectable()
export class GenerateSynthesisStep {
  constructor(private readonly synthesisService: SynthesisService) {}

  async execute(
    sourceText: string,
    precedent: PipelinePrecedentMatch,
    peticaoId?: number,
  ): Promise<PipelineSynthesisResult> {
    const result = await this.synthesisService.generateSynthesis(
      sourceText,
      precedent.tese || precedent.questao || 'Texto do precedente indisponível',
    );

    return {
      percentual_similaridade: this.toSimilarityPercentage(precedent.score),
      classificacao: result.classificacao,
      sintese_explicativa: result.sintese,
      precedente_id: precedent.id,
      peticao_id: peticaoId,
      precedente: precedent,
    };
  }

  private toSimilarityPercentage(score: number | string | undefined): number {
    return score ? Number((((Number(score) + 1) / 2) * 100).toFixed(2)) : 0;
  }
}
