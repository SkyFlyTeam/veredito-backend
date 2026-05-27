/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { FiltrosDto } from '../../dto/filtros.dto';
import { SemanticSearchService } from '../../semantic-search/service/semantic-search.service';
import { PipelinePrecedentMatch } from '../types/pipeline-types';

@Injectable()
export class SearchPrecedentsStep {
  constructor(private readonly semanticSearchService: SemanticSearchService) {}

  async execute(
    embedding: number[],
    filtros?: FiltrosDto,
  ): Promise<PipelinePrecedentMatch[]> {
    return this.semanticSearchService.searchSimilar(embedding, filtros);
  }

  getAverageSimilarityScore(precedents: PipelinePrecedentMatch[]): number {
    return precedents.length > 0
      ? precedents.reduce((acc, item) => acc + Number(item.score ?? 0), 0) /
          precedents.length
      : 0;
  }
}
