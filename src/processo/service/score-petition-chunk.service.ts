import {
  START_SIGNALS,
  MIDDLE_SIGNALS,
  END_SIGNALS,
  PetitionSignal,
} from '../config/petition-signals.config';

import { normalizeForMatch } from '../utils/normalize-text.utils';

export type SignalMatch = {
  name: string;
  weight: number;
};

export type ChunkScore = {
  chunkIndex: number;
  score: number;
  startScore: number;
  middleScore: number;
  endScore: number;
  matches: SignalMatch[];
};

function scoreSignalGroup(text: string, signals: PetitionSignal[]) {
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
): ChunkScore {
  const normalized = normalizeForMatch(text);

  const start = scoreSignalGroup(normalized, START_SIGNALS);
  const middle = scoreSignalGroup(normalized, MIDDLE_SIGNALS);
  const end = scoreSignalGroup(normalized, END_SIGNALS);

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
