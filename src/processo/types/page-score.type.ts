export type SignalMatch = {
  name: string;
  weight: number;
  group: 'start' | 'middle' | 'end';
};

export type PageScore = {
  pageNumber: number;

  rawScore: number;
  startScore: number;
  middleScore: number;
  endScore: number;
  positionScore: number;
  totalScore: number;

  matches: SignalMatch[];
  text: string;
};
