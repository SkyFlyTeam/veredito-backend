import { Signal } from 'src/processo/types/signals.type';
import { ExtractedPage } from '../../types/extracted-page.type';
import { PageScore, SignalMatch } from '../../types/page-score.type';
import { normalizeForMatch } from '../../utils/normalize-text.utils';

function scoreSignalGroup(
  normalizedText: string,
  signals: Signal[],
  group: 'start' | 'middle' | 'end',
): {
  score: number;
  matches: SignalMatch[];
} {
  let score = 0;
  const matches: SignalMatch[] = [];

  for (const signal of signals) {
    if (signal.regex.test(normalizedText)) {
      score += signal.weight;

      matches.push({
        name: signal.name,
        weight: signal.weight,
        group,
      });
    }
  }

  return { score, matches };
}

function calculatePositionScore(
  pageNumber: number,
  totalPages: number,
): number {
  const normalizedPosition = pageNumber / totalPages;

  if (normalizedPosition <= 0.05) return 300;
  if (normalizedPosition <= 0.1) return 220;
  if (normalizedPosition <= 0.2) return 140;
  if (normalizedPosition <= 0.3) return 80;
  if (normalizedPosition <= 0.5) return 30;

  return 0;
}

export function scorePetitionPage(
  page: ExtractedPage,
  totalPages: number,
  start_signals: Signal[],
  middle_signals: Signal[],
  end_signals: Signal[],
): PageScore {
  const normalizedText = normalizeForMatch(page.text);

  const start = scoreSignalGroup(normalizedText, start_signals, 'start');
  const middle = scoreSignalGroup(normalizedText, middle_signals, 'middle');
  const end = scoreSignalGroup(normalizedText, end_signals, 'end');

  const rawScore = start.score + middle.score + end.score;
  const positionScore = calculatePositionScore(page.pageNumber, totalPages);

  const totalScore = rawScore + positionScore;

  return {
    pageNumber: page.pageNumber,

    rawScore,
    startScore: start.score,
    middleScore: middle.score,
    endScore: end.score,
    positionScore,
    totalScore,

    matches: [...start.matches, ...middle.matches, ...end.matches],
    text: page.text,
  };
}
