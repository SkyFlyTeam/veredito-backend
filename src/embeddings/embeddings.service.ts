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
      this.logger.log(`Generating embedding for text: "${text.substring(0, 50)}..."`);

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating embedding with OpenAI', error.stack);
      throw error;
    }
  }
}
