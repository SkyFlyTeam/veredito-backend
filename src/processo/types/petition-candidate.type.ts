export type PetitionCandidate = {
  startPage: number;
  endPage: number;

  score: number;

  startScore: number;
  middleScore: number;
  endScore: number;
  positionScore: number;

  text: string;
  matchedSignals: string[];
};

export type PetitionCandidateChunk = {
  startChunkIndex: number;
  endChunkIndex: number;
  score: number;
  text: string;
};
