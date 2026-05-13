import { Injectable } from '@nestjs/common';
import { WordProcessingService } from '../../peticao/pipeline-services/word_processing/word-processing.service';
import { chunkProcessText } from './chunck-pages.service';
import { findPetitionCandidates } from './find-petition-range.service';

@Injectable()
export class TextSearchPartsService {
  constructor(private readonly wordProcessingService: WordProcessingService) {}

  async searchParts(chunkIndex: number, file: Express.Multer.File) {
    // TODO: Implementar busca por partes do processo

    const text = await this.wordProcessingService.extractTextFromPath(
      file.path,
    );

    const chunks = await chunkProcessText(text);

    const candidates = findPetitionCandidates(chunks);

    const bestCandidate = candidates[0];

    return bestCandidate;
  }
}
