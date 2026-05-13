import { normalizeForMatch } from '../utils/normalize-text.utils';
import { END_SIGNALS, START_SIGNALS } from '../config/petition-signals.config';
import { scorePetitionChunk } from './score-petition-chunk.service';
import { ProcessChunk } from './chunck-pages.service';

export type PetitionCandidate = {
  startChunkIndex: number;
  endChunkIndex: number;
  score: number;
  text: string;
};

function hasAnySignal(text: string, signals: { regex: RegExp }[]): boolean {
  const normalized = normalizeForMatch(text);
  return signals.some((signal) => signal.regex.test(normalized));
}

export function findPetitionCandidates(
  chunks: ProcessChunk[],
): PetitionCandidate[] {
  const candidates: PetitionCandidate[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const currentChunk = chunks[i];

    const hasStart = hasAnySignal(currentChunk.text, START_SIGNALS);

    if (!hasStart) {
      continue;
    }

    const collectedChunks: ProcessChunk[] = [];

    for (let j = i; j < chunks.length; j++) {
      collectedChunks.push(chunks[j]);

      const hasEnd = hasAnySignal(chunks[j].text, END_SIGNALS);

      // Safety limit: avoid accidentally capturing the whole process
      const reachedMaxChunks = j - i >= 20;

      if (hasEnd || reachedMaxChunks) {
        const text = collectedChunks.map((chunk) => chunk.text).join('\n\n');

        const score = collectedChunks.reduce((total, chunk) => {
          return total + scorePetitionChunk(chunk.index, chunk.text).score;
        }, 0);

        candidates.push({
          startChunkIndex: i,
          endChunkIndex: j,
          score,
          text,
        });

        break;
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}
