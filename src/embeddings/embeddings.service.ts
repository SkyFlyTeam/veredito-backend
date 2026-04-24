/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.log(
        `Generating embedding for text: "${text.substring(0, 50)}..."`,
      );

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating embedding with OpenAI', error.stack);
      throw error;
    }
  }

  async generateEmbeddingWithMetrics(text: string): Promise<{ embedding: number[]; tokens: number }> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return {
      embedding: response.data[0].embedding,
      tokens: response.usage.total_tokens,
    };
  }
}
