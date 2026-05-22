import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { WordProcessingService } from '../../peticao/pipeline-services/word_processing/word-processing.service';
import { ContestacaoSignals } from '../config/contestacao-signals.config';
import { PeticionSignals } from '../config/petition-signals.config';
import { TipoPecaEnumerator } from '../enumerator/tipo-peca.enumerator';
import { PetitionCandidate } from '../types/petition-candidate.type';
import { findPetitionCandidatesByPages } from './page-services/find-range-by-page.service';

const MAX_VALIDATION_CANDIDATES = 5;
const MAX_CANDIDATE_TEXT_LENGTH = 3000;

@Injectable()
export class TextSearchPartsService {
  private readonly logger = new Logger(TextSearchPartsService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly wordProcessingService: WordProcessingService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

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

    return this.formatCandidateResponse(bestCandidate);
  }

  async searchContestacao(file: Express.Multer.File) {
    const pages = await this.wordProcessingService.extractPages(file);

    const candidates = findPetitionCandidatesByPages(
      pages,
      ContestacaoSignals.START_SIGNALS,
      ContestacaoSignals.MIDDLE_SIGNALS,
      ContestacaoSignals.END_SIGNALS,
    );

    const bestCandidate = candidates[0];

    if (!bestCandidate) {
      throw new NotFoundException(
        'Não foi possível identificar a contestação no processo.',
      );
    }

    const validationCandidates = candidates.slice(0, MAX_VALIDATION_CANDIDATES);
    const validatedIndex = await this.validatePiece(
      TipoPecaEnumerator.CONTESTACAO,
      validationCandidates,
    );

    const selectedCandidate =
      validatedIndex === null || validatedIndex === -1
        ? bestCandidate
        : validationCandidates[validatedIndex];

    if (!selectedCandidate) {
      throw new NotFoundException(
        'Não foi possível identificar a contestação no processo.',
      );
    }

    return this.formatCandidateResponse(selectedCandidate);
  }

  private formatCandidateResponse(candidate: PetitionCandidate) {
    return {
      startPage: candidate.startPage,
      endPage: candidate.endPage,

      score: candidate.score,

      startScore: candidate.startScore,
      middleScore: candidate.middleScore,
      endScore: candidate.endScore,
      positionScore: candidate.positionScore,

      matchedSignals: candidate.matchedSignals,

      text: candidate.text,
    };
  }

  private async validatePiece(
    tipoPeca: TipoPecaEnumerator,
    candidates: PetitionCandidate[],
  ): Promise<number | null> {
    try {
      this.logger.log(`Validating piece of type: ${tipoPeca}`);

      const candidateDescriptions = candidates
        .map(
          (candidate, index) =>
            `Indice ${index}: paginas ${candidate.startPage}-${candidate.endPage}, score ${candidate.score}\n${candidate.text.substring(0, MAX_CANDIDATE_TEXT_LENGTH)}`,
        )
        .join('\n\n---\n\n');

      const prompt = `Você é um assistente jurídico especializado em análise de processos judiciais.
        Sua tarefa é analisar os candidatos abaixo e decidir qual deles é mais provável de ser uma ${tipoPeca}.
        ${candidateDescriptions}
        Responda somente com JSON no formato {"index": 0}. Use o índice original do candidato. Caso nenhum candidato seja relevante, responda {"index": -1}.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente jurídico altamente técnico. Responda apenas em formato JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);
      const parsedIndex = Number(result.index);

      if (!Number.isInteger(parsedIndex)) {
        return null;
      }

      if (parsedIndex < -1 || parsedIndex >= candidates.length) {
        return null;
      }

      return parsedIndex;
    } catch (error) {
      this.logger.error('Error validating piece', error.stack);
      return null;
    }
  }
}
