import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}));

import { TextSearchPartsService } from '../../src/processo/service/text-search-parts.service';
import { WordProcessingService } from '../../src/peticao/pipeline-services/word_processing/word-processing.service';
import { ExtractedPage } from '../../src/processo/types/extracted-page.type';

const makeFile = (): Express.Multer.File =>
  ({
    originalname: 'processo.pdf',
  }) as Express.Multer.File;

describe('TextSearchPartsService', () => {
  const buildService = (pages: ExtractedPage[]) => {
    const wordProcessingService = {
      extractPages: jest
        .fn<() => Promise<ExtractedPage[]>>()
        .mockResolvedValue(pages),
    } as unknown as WordProcessingService;

    return {
      service: new TextSearchPartsService(wordProcessingService),
      wordProcessingService,
    };
  };

  it('should return the best petition candidate found in extracted pages', async () => {
    const pages: ExtractedPage[] = [
      { pageNumber: 1, text: 'capa do processo' },
      {
        pageNumber: 2,
        text: 'PETICAO INICIAL EM ANEXO\nDOS FATOS\nDO DIREITO',
      },
      {
        pageNumber: 3,
        text: 'DOS PEDIDOS\nVALOR DA CAUSA\nPEDE DEFERIMENTO\nOAB/ES 12345',
      },
    ];
    const { service, wordProcessingService } = buildService(pages);
    const file = makeFile();

    const result = await service.searchPeticaoInicial(file);

    expect(wordProcessingService.extractPages).toHaveBeenCalledWith(file);
    expect(result).toMatchObject({
      startPage: 2,
      endPage: 3,
      startScore: 1000,
      middleScore: 240,
      endScore: 140,
      positionScore: 0,
    });
    expect(result.score).toBeGreaterThan(10000);
    expect(result.matchedSignals).toEqual(
      expect.arrayContaining([
        'peticao_inicial_em_anexo',
        'dos_fatos',
        'do_direito',
        'dos_pedidos',
        'valor_da_causa',
        'pede_deferimento',
        'oab',
      ]),
    );
    expect(result.text).toContain('PETICAO INICIAL EM ANEXO');
  });

  it('should throw NotFoundException when no petition candidate is identified', async () => {
    const { service } = buildService([
      { pageNumber: 1, text: 'capa sem sinais úteis' },
      { pageNumber: 2, text: 'andamento processual genérico' },
    ]);

    await expect(service.searchPeticaoInicial(makeFile())).rejects.toThrow(
      NotFoundException,
    );
  });
});
