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

export type ProcessChunk = {
  index: number;
  pageStart?: number;
  pageEnd?: number;
  text: string;
};
