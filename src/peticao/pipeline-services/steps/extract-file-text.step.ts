import { Injectable } from '@nestjs/common';
import { WordProcessingService } from '../word_processing/word-processing.service';

@Injectable()
export class ExtractFileTextStep {
  constructor(private readonly wordProcessingService: WordProcessingService) {}

  async execute(filePath: string): Promise<string> {
    const rawText =
      await this.wordProcessingService.extractTextFromPath(filePath);

    if (!rawText) {
      throw new Error('Falha ao extrair texto do arquivo da petição.');
    }

    return rawText;
  }
}
