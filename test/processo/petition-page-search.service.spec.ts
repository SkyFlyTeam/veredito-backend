import { describe, expect, it } from '@jest/globals';

import { findPetitionCandidatesByPages } from '../../src/processo/service/page-services/find-range-by-page.service';
import { scorePetitionPage } from '../../src/processo/service/page-services/score-page.service';
import { findPetitionCandidates } from '../../src/processo/service/chunk-services/find-range.service';
import { scorePetitionChunk } from '../../src/processo/service/chunk-services/score-chunk.service';
import { ExtractedPage } from '../../src/processo/types/extracted-page.type';
import { ProcessChunk } from '../../src/processo/types/chunk.type';
import { Signal } from '../../src/processo/types/signals.type';

const startSignals: Signal[] = [
  {
    name: 'excelentissimo_senhor',
    regex: /EXCELENTISSIMO\s+SENHOR/i,
    weight: 80,
  },
  {
    name: 'peticao_inicial_em_anexo',
    regex: /PETICAO\s+INICIAL\s+EM\s+ANEXO/i,
    weight: 1000,
  },
];

const middleSignals: Signal[] = [
  { name: 'dos_fatos', regex: /DOS\s+FATOS/i, weight: 50 },
  { name: 'dos_pedidos', regex: /DOS\s+PEDIDOS/i, weight: 70 },
];

const endSignals: Signal[] = [
  { name: 'pede_deferimento', regex: /PEDE\s+DEFERIMENTO/i, weight: 100 },
];

describe('processo petition search helpers', () => {
  describe('scorePetitionPage', () => {
    it('should score start, middle, end and early-position signals', () => {
      const page: ExtractedPage = {
        pageNumber: 1,
        text: 'Excelentíssimo Senhor\nDos fatos\nPede deferimento',
      };

      const result = scorePetitionPage(
        page,
        20,
        startSignals,
        middleSignals,
        endSignals,
      );

      expect(result).toMatchObject({
        pageNumber: 1,
        startScore: 80,
        middleScore: 50,
        endScore: 100,
        positionScore: 300,
        rawScore: 230,
        totalScore: 530,
      });
      expect(result.matches.map((match) => match.name)).toEqual([
        'excelentissimo_senhor',
        'dos_fatos',
        'pede_deferimento',
      ]);
    });
  });

  describe('findPetitionCandidatesByPages', () => {
    it('should find a candidate from the first strong start page through the end page', () => {
      const pages: ExtractedPage[] = [
        { pageNumber: 1, text: 'capa do processo' },
        { pageNumber: 2, text: 'EXCELENTISSIMO SENHOR\nDOS FATOS relevantes' },
        { pageNumber: 3, text: 'DOS PEDIDOS principais' },
        { pageNumber: 4, text: 'PEDE DEFERIMENTO' },
      ];

      const [candidate] = findPetitionCandidatesByPages(
        pages,
        startSignals,
        middleSignals,
        endSignals,
      );

      expect(candidate).toMatchObject({
        startPage: 2,
        endPage: 4,
        startScore: 80,
        middleScore: 120,
        endScore: 100,
        positionScore: 30,
      });
      expect(candidate.text).toBe(
        'EXCELENTISSIMO SENHOR\nDOS FATOS relevantes\n\nDOS PEDIDOS principais\n\nPEDE DEFERIMENTO',
      );
      expect(candidate.matchedSignals).toEqual([
        'excelentissimo_senhor',
        'dos_fatos',
        'dos_pedidos',
        'pede_deferimento',
      ]);
    });

    it('should rank hard petition-start candidates above ordinary candidates', () => {
      const pages: ExtractedPage[] = [
        { pageNumber: 1, text: 'EXCELENTISSIMO SENHOR\nPEDE DEFERIMENTO' },
        { pageNumber: 2, text: 'PETICAO INICIAL EM ANEXO\nPEDE DEFERIMENTO' },
      ];

      const candidates = findPetitionCandidatesByPages(
        pages,
        startSignals,
        middleSignals,
        endSignals,
      );

      expect(candidates[0]).toMatchObject({
        startPage: 2,
        endPage: 2,
      });
      expect(candidates[0].score).toBeGreaterThan(candidates[1].score);
    });

    it('should ignore start pages that never reach an end signal', () => {
      const pages: ExtractedPage[] = [
        { pageNumber: 1, text: 'EXCELENTISSIMO SENHOR' },
        { pageNumber: 2, text: 'DOS FATOS sem encerramento' },
      ];

      const candidates = findPetitionCandidatesByPages(
        pages,
        startSignals,
        middleSignals,
        endSignals,
      );

      expect(candidates).toEqual([]);
    });
  });

  describe('chunk helpers', () => {
    it('should score petition chunks with the injected signal groups', () => {
      const result = scorePetitionChunk(
        7,
        'EXCELENTISSIMO SENHOR\nDOS PEDIDOS\nPEDE DEFERIMENTO',
        startSignals,
        middleSignals,
        endSignals,
      );

      expect(result).toMatchObject({
        chunkIndex: 7,
        score: 250,
        startScore: 80,
        middleScore: 70,
        endScore: 100,
      });
    });

    it('should find and sort chunk candidates by score', () => {
      const chunks: ProcessChunk[] = [
        { index: 0, text: 'EXCELENTISSIMO SENHOR' },
        { index: 1, text: 'PEDE DEFERIMENTO' },
        { index: 2, text: 'EXCELENTISSIMO SENHOR\nDOS FATOS\nDOS PEDIDOS' },
        { index: 3, text: 'PEDE DEFERIMENTO' },
      ];

      const candidates = findPetitionCandidates(
        chunks,
        startSignals,
        middleSignals,
        endSignals,
      );

      expect(candidates).toHaveLength(2);
      expect(candidates[0]).toMatchObject({
        startChunkIndex: 2,
        endChunkIndex: 3,
        score: 300,
      });
      expect(candidates[1]).toMatchObject({
        startChunkIndex: 0,
        endChunkIndex: 1,
        score: 180,
      });
    });
  });
});
