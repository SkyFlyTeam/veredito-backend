import { Injectable } from '@nestjs/common';
import { basename } from 'node:path';
import { TipoPecaEnumerator } from '../../enumerator/tipo-peca.enumerator';
import { TextSearchPartsService } from '../../service/text-search-parts.service';
import { ProcessoPipelinePiece } from '../types/processo-pipeline-piece.type';

interface PieceSearchResult {
  startPage: number;
  endPage?: number;
  score?: number;
  text: string;
}

@Injectable()
export class SearchProcessPiecesStep {
  constructor(
    private readonly textSearchPartsService: TextSearchPartsService,
  ) {}

  async execute(
    filePath: string,
    originalname?: string,
  ): Promise<ProcessoPipelinePiece[]> {
    const file = this.toMulterFile(filePath, originalname);
    const pieces: ProcessoPipelinePiece[] = [];

    const peticao =
      await this.textSearchPartsService.searchPeticaoInicial(file);
    pieces.push(this.toPiece(TipoPecaEnumerator.PETICAO_INICIAL, peticao));

    const optionalSearches: Array<
      [
        TipoPecaEnumerator,
        (file: Express.Multer.File) => Promise<PieceSearchResult | null>,
      ]
    > = [
      [
        TipoPecaEnumerator.CONTESTACAO,
        (input) => this.textSearchPartsService.searchContestacao(input),
      ],
      [
        TipoPecaEnumerator.SENTENCA,
        (input) => this.textSearchPartsService.searchSentenca(input),
      ],
      [
        TipoPecaEnumerator.RECURSO,
        (input) => this.textSearchPartsService.searchRecurso(input),
      ],
    ];

    for (const [type, search] of optionalSearches) {
      const result = await search(file);

      if (result) {
        pieces.push(this.toPiece(type, result));
      }
    }

    return pieces;
  }

  private toMulterFile(
    filePath: string,
    originalname?: string,
  ): Express.Multer.File {
    return {
      path: filePath,
      originalname: originalname ?? basename(filePath),
    } as Express.Multer.File;
  }

  private toPiece(
    type: TipoPecaEnumerator,
    result: PieceSearchResult,
  ): ProcessoPipelinePiece {
    return {
      type,
      name: type,
      startPage: result.startPage,
      endPage: result.endPage,
      score: result.score,
      text: result.text,
    };
  }
}
