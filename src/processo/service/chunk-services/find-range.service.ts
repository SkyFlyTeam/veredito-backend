import { Signal } from 'src/processo/types/signals.type';
import { normalizeForMatch } from '../../utils/normalize-text.utils';
import { scorePetitionChunk } from './score-chunk.service';
import { ProcessChunk } from 'src/processo/types/chunk.type';
import { PetitionCandidateChunk } from 'src/processo/types/petition-candidate.type';

function hasAnySignal(text: string, signals: { regex: RegExp }[]): boolean {
  const normalized = normalizeForMatch(text);
  return signals.some((signal) => signal.regex.test(normalized));
}

export function findPetitionCandidates(
  chunks: ProcessChunk[],
  startSignals: Signal[],
  middleSignals: Signal[],
  endSignals: Signal[],
): PetitionCandidateChunk[] {
  const candidates: PetitionCandidateChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const currentChunk = chunks[i];

    const hasStart = hasAnySignal(currentChunk.text, startSignals);

    if (!hasStart) {
      continue;
    }

    const collectedChunks: ProcessChunk[] = [];

    for (let j = i; j < chunks.length; j++) {
      collectedChunks.push(chunks[j]);

      const hasEnd = hasAnySignal(chunks[j].text, endSignals);

      const reachedMaxChunks = j - i >= 20;

      if (hasEnd || reachedMaxChunks) {
        const text = collectedChunks.map((chunk) => chunk.text).join('\n\n');

        const score = collectedChunks.reduce((total, chunk) => {
          return (
            total +
            scorePetitionChunk(
              chunk.index,
              chunk.text,
              startSignals,
              middleSignals,
              endSignals,
            ).score
          );
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
