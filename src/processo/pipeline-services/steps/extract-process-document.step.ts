import { Injectable } from '@nestjs/common';
import { WordProcessingService } from '../../../peticao/pipeline-services/word_processing/word-processing.service';

@Injectable()
export class ExtractProcessDocumentStep {
  constructor(private readonly wordProcessingService: WordProcessingService) {}

  async execute(filePath: string): Promise<string> {
    const rawText =
      await this.wordProcessingService.extractTextFromPath(filePath);

    if (!rawText?.trim()) {
      throw new Error('Falha ao extrair texto do arquivo do processo.');
    }

    return rawText;
  }
}
