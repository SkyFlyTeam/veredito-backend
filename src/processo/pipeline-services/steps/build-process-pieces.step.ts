import { Injectable } from '@nestjs/common';
import { TipoPecaEnumerator } from '../../enumerator/tipo-peca.enumerator';
import { ProcessPieces } from '../../types/process-pieces.type';
import { ProcessoPipelinePiece } from '../types/processo-pipeline-piece.type';

@Injectable()
export class BuildProcessPiecesStep {
  execute(pieces: ProcessoPipelinePiece[]): ProcessPieces {
    const processPieces = {} as ProcessPieces;

    for (const piece of pieces) {
      switch (piece.type) {
        case TipoPecaEnumerator.PETICAO_INICIAL:
          processPieces.peticao = piece.text;
          break;
        case TipoPecaEnumerator.CONTESTACAO:
          processPieces.contestacao = piece.text;
          break;
        case TipoPecaEnumerator.SENTENCA:
          processPieces.sentenca = piece.text;
          break;
        case TipoPecaEnumerator.RECURSO:
          processPieces.recurso = piece.text;
          break;
      }
    }

    if (!processPieces.peticao) {
      throw new Error('Petição inicial não encontrada no processo.');
    }

    return processPieces;
  }
}
