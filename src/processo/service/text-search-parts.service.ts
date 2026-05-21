import { Injectable, NotFoundException } from '@nestjs/common';
import { WordProcessingService } from '../../peticao/pipeline-services/word_processing/word-processing.service';
import { findPetitionCandidatesByPages } from './page-services/find-range-by-page.service';
import { PeticionSignals } from '../config/petition-signals.config';
import { ContestacaoSignals } from '../config/contestacao-signals.config';

@Injectable()
export class TextSearchPartsService {
  constructor(private readonly wordProcessingService: WordProcessingService) {}

  async searchPeticaoInicial(file: Express.Multer.File) {
    const pages = await this.wordProcessingService.extractPages(file);

    const candidates = findPetitionCandidatesByPages(
      pages,
      PeticionSignals.START_SIGNALS,
      PeticionSignals.MIDDLE_SIGNALS,
      PeticionSignals.END_SIGNALS,
    );

    const bestCandidate = candidates[0];

    if (!bestCandidate) {
      throw new NotFoundException(
        'Não foi possível identificar a petição inicial no processo.',
      );
    }

    return {
      startPage: bestCandidate.startPage,
      endPage: bestCandidate.endPage,

      score: bestCandidate.score,

      startScore: bestCandidate.startScore,
      middleScore: bestCandidate.middleScore,
      endScore: bestCandidate.endScore,
      positionScore: bestCandidate.positionScore,

      matchedSignals: bestCandidate.matchedSignals,

      text: bestCandidate.text,
    };
  }

  // TODO: Implementar realmente esse método depois de testar
  async searchContestacao(file: Express.Multer.File) {
    // Remove o texto do arquivo recebido
    const pages = await this.wordProcessingService.extractPages(file);

    // Encontra os candidatos
    const candidates = findPetitionCandidatesByPages(
      pages,
      ContestacaoSignals.START_SIGNALS,
      ContestacaoSignals.MIDDLE_SIGNALS,
      ContestacaoSignals.END_SIGNALS,
    );

    // Retorna o melhor candidato
    const bestCandidate = candidates[0];

    if (!bestCandidate) {
      throw new NotFoundException(
        'Não foi possível identificar a contestação no processo.',
      );
    }

    return candidates;

    /*return {
      startPage: bestCandidate.startPage,
      endPage: bestCandidate.endPage,

      score: bestCandidate.score,

      startScore: bestCandidate.startScore,
      middleScore: bestCandidate.middleScore,
      endScore: bestCandidate.endScore,
      positionScore: bestCandidate.positionScore,

      matchedSignals: bestCandidate.matchedSignals,

      text: bestCandidate.text,
    };*/
  }
}
