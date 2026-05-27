import { Injectable } from '@nestjs/common';
import { EmbeddingsService } from '../../../embeddings/embeddings.service';

@Injectable()
export class GenerateEmbeddingStep {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  execute(text: string): Promise<number[]> {
    return this.embeddingsService.generateEmbedding(text.slice(0, 3000));
  }
}
