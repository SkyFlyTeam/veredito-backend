import { Signal } from 'src/processo/types/signals.type';
import { ChunkScore, SignalMatch } from '../../types/chunk.type';

import { normalizeForMatch } from '../../utils/normalize-text.utils';

function scoreSignalGroup(text: string, signals: Signal[]) {
  const matches: SignalMatch[] = [];
  let score = 0;

  for (const signal of signals) {
    if (signal.regex.test(text)) {
      score += signal.weight;
      matches.push({
        name: signal.name,
        weight: signal.weight,
      });
    }
  }

  return { score, matches };
}

export function scorePetitionChunk(
  chunkIndex: number,
  text: string,
  startSignals: Signal[],
  middleSignals: Signal[],
  endSignals: Signal[],
): ChunkScore {
  const normalized = normalizeForMatch(text);

  const start = scoreSignalGroup(normalized, startSignals);
  const middle = scoreSignalGroup(normalized, middleSignals);
  const end = scoreSignalGroup(normalized, endSignals);

  const score = start.score + middle.score + end.score;

  return {
    chunkIndex,
    score,
    startScore: start.score,
    middleScore: middle.score,
    endScore: end.score,
    matches: [...start.matches, ...middle.matches, ...end.matches],
  };
}
