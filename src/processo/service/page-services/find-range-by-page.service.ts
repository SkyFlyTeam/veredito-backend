import { Signal } from 'src/processo/types/signals.type';
import { ExtractedPage } from '../../types/extracted-page.type';
import { PetitionCandidate } from '../../types/petition-candidate.type';
import { scorePetitionPage } from './score-page.service';

const MIN_START_SCORE = 80;
const MIN_END_SCORE = 80;
const MAX_PETITION_PAGES = 80;

function hasHardPetitionStartSignal(signalNames: string[]): boolean {
  return (
    signalNames.includes('peticao_inicial_em_anexo') ||
    signalNames.includes('peticao_inicial')
  );
}

export function findPetitionCandidatesByPages(
  pages: ExtractedPage[],
  start_signals: Signal[],
  middle_signals: Signal[],
  end_signals: Signal[],
): PetitionCandidate[] {
  const totalPages = pages.length;

  const scoredPages = pages.map((page) =>
    scorePetitionPage(
      page,
      totalPages,
      start_signals,
      middle_signals,
      end_signals,
    ),
  );

  const candidates: PetitionCandidate[] = [];

  for (let i = 0; i < scoredPages.length; i++) {
    const startPageScore = scoredPages[i];

    const startSignalNames = startPageScore.matches
      .filter((match) => match.group === 'start')
      .map((match) => match.name);

    const hasStrongStart =
      startPageScore.startScore >= MIN_START_SCORE ||
      hasHardPetitionStartSignal(startSignalNames);

    if (!hasStrongStart) {
      continue;
    }

    let endIndex = -1;

    let accumulatedScore = startPageScore.totalScore;
    let accumulatedMiddleScore = 0;
    let accumulatedEndScore = 0;

    const matchedSignals = startPageScore.matches.map((match) => match.name);

    for (let j = i; j < scoredPages.length; j++) {
      const currentPageScore = scoredPages[j];

      if (j !== i) {
        accumulatedScore += currentPageScore.rawScore;
      }

      accumulatedMiddleScore += currentPageScore.middleScore;
      accumulatedEndScore += currentPageScore.endScore;

      matchedSignals.push(
        ...currentPageScore.matches.map((match) => match.name),
      );

      const hasEnd = currentPageScore.endScore >= MIN_END_SCORE;
      const reachedMaxPages = j - i + 1 >= MAX_PETITION_PAGES;

      if (hasEnd || reachedMaxPages) {
        endIndex = j;
        break;
      }
    }

    if (endIndex === -1) {
      continue;
    }

    const candidatePages = pages.slice(i, endIndex + 1);

    const candidateText = candidatePages.map((page) => page.text).join('\n\n');

    const uniqueMatchedSignals = Array.from(new Set(matchedSignals));

    const hasHardStart = hasHardPetitionStartSignal(uniqueMatchedSignals);

    const hardStartBonus = hasHardStart ? 10000 : 0;

    candidates.push({
      startPage: pages[i].pageNumber,
      endPage: pages[endIndex].pageNumber,

      score: accumulatedScore + hardStartBonus,

      startScore: startPageScore.startScore,
      middleScore: accumulatedMiddleScore,
      endScore: accumulatedEndScore,
      positionScore: startPageScore.positionScore,

      text: candidateText,
      matchedSignals: uniqueMatchedSignals,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}
