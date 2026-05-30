import { TipoPecaEnumerator } from '../../enumerator/tipo-peca.enumerator';

export interface ProcessoPipelinePiece {
  type: TipoPecaEnumerator;
  name: string;
  startPage: number;
  endPage?: number;
  score?: number;
  text: string;
}
