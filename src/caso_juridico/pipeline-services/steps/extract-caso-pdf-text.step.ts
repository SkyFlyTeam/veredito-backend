import { Injectable } from '@nestjs/common';
import { WordProcessingService } from '../../../peticao/pipeline-services/word_processing/word-processing.service';

@Injectable()
export class ExtractCasoPdfTextStep {
  constructor(private readonly wordProcessingService: WordProcessingService) {}

  async execute(pdfBuffer: Buffer, casoId: number): Promise<string> {
    const rawText = await this.wordProcessingService.extractText({
      originalname: `peticao-caso-${casoId}.pdf`,
      buffer: pdfBuffer,
    } as Express.Multer.File);

    if (!rawText?.trim()) {
      throw new Error(
        'Falha ao extrair texto do PDF gerado para o caso jurídico.',
      );
    }

    return rawText;
  }
}
