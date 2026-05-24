import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

const mockCreateChatCompletion = jest.fn();

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreateChatCompletion,
      },
    },
  })),
);

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}));

import { TextSearchPartsService } from '../../src/processo/service/text-search-parts.service';
import { WordProcessingService } from '../../src/peticao/pipeline-services/word_processing/word-processing.service';
import { ExtractedPage } from '../../src/processo/types/extracted-page.type';
import { ConfigService } from '@nestjs/config';

const makeFile = (): Express.Multer.File =>
  ({
    originalname: 'processo.pdf',
  }) as Express.Multer.File;

describe('TextSearchPartsService', () => {
  beforeEach(() => {
    mockCreateChatCompletion.mockReset();
  });

  const buildService = (pages: ExtractedPage[]) => {
    const wordProcessingService = {
      extractPages: jest
        .fn<() => Promise<ExtractedPage[]>>()
        .mockResolvedValue(pages),
    } as unknown as WordProcessingService;

    const configService = {
      get: jest.fn(() => 'test-api-key'),
    } as unknown as ConfigService;

    return {
      service: new TextSearchPartsService(wordProcessingService, configService),
      wordProcessingService,
    };
  };

  const mockValidationIndex = (index: number | string) => {
    mockCreateChatCompletion.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ index }) } }],
    });
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
    expect(mockCreateChatCompletion).not.toHaveBeenCalled();
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

  it('should validate and return the selected contestacao candidate without calling the real LLM', async () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        text: [
          'vem apresentar a presente CONTESTACAO',
          'PRELIMINARMENTE, impugna-se os pedidos formulados pelo autor.',
          'DO MERITO',
          'DOS PEDIDOS FINAIS',
          'Requer a total improcedência dos pedidos formulados pelo autor.',
        ].join('\n'),
      },
    ];
    const { service, wordProcessingService } = buildService(pages);
    const file = makeFile();
    mockValidationIndex(0);

    const result = await service.searchContestacao(file);

    expect(wordProcessingService.extractPages).toHaveBeenCalledWith(file);
    expect(mockCreateChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    );
    expect(result).toMatchObject({
      startPage: 1,
      endPage: 1,
      matchedSignals: expect.arrayContaining([
        'vem_apresentar_contestacao',
        'preliminarmente',
        'requer_total_improcedencia',
      ]),
    });
    expect(result?.text).toContain('CONTESTACAO');
  });

  it('should return null when the mocked LLM rejects recurso candidates', async () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 4,
        text: [
          'APELAÇÃO',
          'RECORRENTE: Empresa A',
          'RECORRIDO: Empresa B',
          'ADMISSIBILIDADE DO PRESENTE RECURSO',
          'DAS RAZÕES DO RECURSO',
          'Requer a reforma da sentença recorrida.',
        ].join('\n'),
      },
    ];
    const { service } = buildService(pages);
    mockValidationIndex(-1);

    await expect(service.searchRecurso(makeFile())).resolves.toBeNull();

    const request = mockCreateChatCompletion.mock.calls[0][0];
    expect(request.messages[1].content).toContain(
      'algum dos candidatos abaixo é de fato uma recurso',
    );
  });

  it('should return null when the mocked LLM returns an out-of-range sentenca index', async () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 8,
        text: [
          'SENTENÇA',
          'Vieram os autos conclusos.',
          'É o relatório, em síntese. Decido',
          'Ante o exposto, CONCEDO A SEGURANÇA.',
        ].join('\n'),
      },
    ];
    const { service } = buildService(pages);
    mockValidationIndex(1);

    await expect(service.searchSentenca(makeFile())).resolves.toBeNull();
  });

  it('should return null when piece validation fails to parse the mocked LLM response', async () => {
    const pages: ExtractedPage[] = [
      {
        pageNumber: 2,
        text: [
          'vem apresentar a presente CONTESTACAO',
          'DO MERITO',
          'DOS PEDIDOS FINAIS',
          'Requer a improcedência dos pedidos.',
        ].join('\n'),
      },
    ];
    const { service } = buildService(pages);
    mockCreateChatCompletion.mockResolvedValue({
      choices: [{ message: { content: 'not-json' } }],
    });

    await expect(service.searchContestacao(makeFile())).resolves.toBeNull();
  });

  it('should truncate long candidate text before sending it to the mocked LLM', async () => {
    const visibleText = 'A'.repeat(5000);
    const truncatedText = 'SHOULD_NOT_BE_SENT_TO_LLM';
    const pages: ExtractedPage[] = [
      {
        pageNumber: 5,
        text: [
          'vem apresentar a presente CONTESTACAO',
          'DO MERITO',
          'DOS PEDIDOS FINAIS',
          'Requer a improcedência dos pedidos.',
          visibleText,
          truncatedText,
        ].join('\n'),
      },
    ];
    const { service } = buildService(pages);
    mockValidationIndex(0);

    await service.searchContestacao(makeFile());

    const request = mockCreateChatCompletion.mock.calls[0][0];
    expect(request.messages[1].content).toContain('Indice 0: paginas 5-5');
    expect(request.messages[1].content).not.toContain(truncatedText);
  });
});
