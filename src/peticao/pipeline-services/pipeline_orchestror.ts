import { Injectable } from '@nestjs/common';
import { WordProcessingService } from './word_processing/word-processing.service';
import { TextProcessingService } from './word_processing/text-processing.service';

export interface PipelineResult {
  rawText: string;
  processedText: string;
}

@Injectable()
export class PipelineOrchestrator {
  constructor(
    private readonly wordProcessingService: WordProcessingService,
    private readonly textProcessingService: TextProcessingService,
  ) {}

  /**
   * Runs the full text processing pipeline for an uploaded file.
   *
   * Steps:
   * 1. Text extraction – reads raw text from the file (PDF, DOCX or TXT)
   * 2. NLP processing  – tokenization, lowercase, stopword removal, stemming
   *
   * @param file - File received by Multer
   * @returns PipelineResult with both the raw and the NLP-processed text
   */
  async run(file: Express.Multer.File): Promise<PipelineResult> {
    const rawText = await this.wordProcessingService.extractText(file);
    const processedText = this.textProcessingService.process(rawText);

    return { rawText, processedText };
  }
}
