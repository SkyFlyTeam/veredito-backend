import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';

// jest.mock() is hoisted by ts-jest before imports, intercepting the
// module-level require('pdf-parse') call inside word-processing.service.ts.

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}));

import {
  WordProcessingService,
  ALLOWED_EXTENSIONS,
} from '../../src/peticao/pipeline-services/word_processing/word-processing.service';

const makeFile = (
  originalname: string,
  content: Buffer = Buffer.alloc(0),
): Express.Multer.File => ({
  fieldname: 'file',
  originalname,
  encoding: '7bit',
  mimetype: 'application/octet-stream',
  buffer: content,
  size: content.length,
  stream: null as any,
  destination: '',
  filename: originalname,
  path: '',
});

describe('WordProcessingService', () => {
  let service: WordProcessingService;
  let PDFParseMock: jest.MockedFunction<any>;
  let mammothMock: { extractRawText: jest.MockedFunction<any> };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WordProcessingService();
    PDFParseMock = (jest.requireMock('pdf-parse') as any).PDFParse;
    mammothMock = jest.requireMock('mammoth') as any;
  });

  describe('extractText', () => {
    describe('extension validation', () => {
      it('should throw BadRequestException for an unsupported extension', async () => {
        await expect(
          service.extractText(makeFile('document.exe')),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when the file has no extension', async () => {
        await expect(service.extractText(makeFile('filename'))).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should include the allowed extensions list in the error message', async () => {
        await expect(
          service.extractText(makeFile('document.exe')),
        ).rejects.toThrow(ALLOWED_EXTENSIONS.join(', '));
      });
    });

    describe('PDF parsing', () => {
      it('should extract and return text from a PDF file', async () => {
        const pdfText =
          'conteúdo do pdf com texto suficiente para passar na validação mínima';
        const mockGetText = jest
          .fn<() => Promise<{ text: string }>>()
          .mockResolvedValue({ text: pdfText });
        PDFParseMock.mockImplementation(() => ({ getText: mockGetText }));

        const result = await service.extractText(
          makeFile('peticao.pdf', Buffer.from('bytes')),
        );

        expect(result).toBe(pdfText);
      });

      it('should instantiate PDFParse with the file buffer', async () => {
        const buffer = Buffer.from('pdf bytes');
        PDFParseMock.mockImplementation(() => ({
          getText: jest
            .fn<() => Promise<{ text: string }>>()
            .mockResolvedValue({
              text: 'texto do pdf com tamanho suficiente para validar o parser',
            }),
        }));

        await service.extractText(makeFile('peticao.pdf', buffer));

        expect(PDFParseMock).toHaveBeenCalledWith({ data: buffer });
      });

      it('should remove page number lines like "-- 1 of 3 --" from the extracted text', async () => {
        const rawText =
          'Introdução do documento com texto suficiente\n-- 1 of 3 --\nCapítulo um com texto suficiente\n-- 2 of 3 --\nConclusão com texto suficiente';
        PDFParseMock.mockImplementation(() => ({
          getText: jest
            .fn<() => Promise<{ text: string }>>()
            .mockResolvedValue({ text: rawText }),
        }));

        const result = await service.extractText(
          makeFile('peticao.pdf', Buffer.from('bytes')),
        );

        expect(result).not.toMatch(/--\s*\d+\s+of\s+\d+\s*--/i);
        expect(result).toContain('Introdução');
        expect(result).toContain('Capítulo um');
        expect(result).toContain('Conclusão');
      });

      it('should return text unchanged when there are no page number lines', async () => {
        const rawText =
          'Texto limpo sem numeração de página e com tamanho suficiente';
        PDFParseMock.mockImplementation(() => ({
          getText: jest
            .fn<() => Promise<{ text: string }>>()
            .mockResolvedValue({ text: rawText }),
        }));

        const result = await service.extractText(
          makeFile('peticao.pdf', Buffer.from('bytes')),
        );

        expect(result).toBe(rawText);
      });
    });

    describe('DOCX parsing', () => {
      it('should extract and return text from a DOCX file using mammoth', async () => {
        mammothMock.extractRawText.mockResolvedValue({
          value: 'conteúdo do docx',
        });

        const result = await service.extractText(
          makeFile('peticao.docx', Buffer.from('bytes')),
        );

        expect(result).toBe('conteúdo do docx');
      });

      it('should call mammoth.extractRawText with the file buffer', async () => {
        const buffer = Buffer.from('docx bytes');
        mammothMock.extractRawText.mockResolvedValue({ value: 'texto' });

        await service.extractText(makeFile('peticao.docx', buffer));

        expect(mammothMock.extractRawText).toHaveBeenCalledWith({ buffer });
      });
    });

    describe('TXT parsing', () => {
      it('should return the decoded UTF-8 content of a TXT file', async () => {
        const content = Buffer.from('Texto simples em UTF-8', 'utf-8');

        const result = await service.extractText(
          makeFile('peticao.txt', content),
        );

        expect(result).toBe('Texto simples em UTF-8');
      });

      it('should strip UTF-8 BOM (\\uFEFF) from the beginning of TXT files', async () => {
        // UTF-8 BOM bytes: EF BB BF → decoded to \uFEFF character
        const bom = Buffer.from([0xef, 0xbb, 0xbf]);
        const content = Buffer.concat([bom, Buffer.from('Texto', 'utf-8')]);

        const result = await service.extractText(
          makeFile('peticao.txt', content),
        );

        expect(result.charCodeAt(0)).not.toBe(0xfeff);
        expect(result).toBe('Texto');
      });

      it('should normalize Windows-style CRLF (\\r\\n) to LF (\\n)', async () => {
        const content = Buffer.from('linha1\r\nlinha2\r\nlinha3', 'utf-8');

        const result = await service.extractText(
          makeFile('peticao.txt', content),
        );

        expect(result).toBe('linha1\nlinha2\nlinha3');
        expect(result).not.toContain('\r');
      });

      it('should normalize old Mac-style CR-only (\\r) line endings to LF (\\n)', async () => {
        const content = Buffer.from('linha1\rlinha2\rlinha3', 'utf-8');

        const result = await service.extractText(
          makeFile('peticao.txt', content),
        );

        expect(result).toBe('linha1\nlinha2\nlinha3');
        expect(result).not.toContain('\r');
      });

      it('should accept .txt files with uppercase extension', async () => {
        const content = Buffer.from('texto', 'utf-8');

        const result = await service.extractText(
          makeFile('peticao.TXT', content),
        );

        expect(result).toBe('texto');
      });
    });
  });

  describe('extractPages', () => {
    it('should return one page for TXT files sent as a buffer', async () => {
      const content = Buffer.from('Primeira linha\r\nSegunda linha', 'utf-8');

      const result = await service.extractPages(
        makeFile('processo.txt', content),
      );

      expect(result).toEqual([
        {
          pageNumber: 1,
          text: 'Primeira linha\nSegunda linha',
        },
      ]);
    });

    it('should return one page for DOCX files sent as a buffer', async () => {
      mammothMock.extractRawText.mockResolvedValue({
        value: 'texto extraído do docx',
      });
      const buffer = Buffer.from('docx bytes');

      const result = await service.extractPages(
        makeFile('processo.docx', buffer),
      );

      expect(mammothMock.extractRawText).toHaveBeenCalledWith({ buffer });
      expect(result).toEqual([
        {
          pageNumber: 1,
          text: 'texto extraído do docx',
        },
      ]);
    });

    it('should split PDF text into pages using pdf-parse page markers', async () => {
      const rawText = [
        '-- 1 of 2 --',
        'EXCELENTISSIMO SENHOR',
        'DOS FATOS narrados na inicial',
        '-- 2 of 2 --',
        'DOS PEDIDOS',
        'PEDE DEFERIMENTO',
      ].join('\n');
      PDFParseMock.mockImplementation(() => ({
        getText: jest
          .fn<() => Promise<{ text: string }>>()
          .mockResolvedValue({ text: rawText }),
      }));

      const result = await service.extractPages(
        makeFile('processo.pdf', Buffer.from('pdf bytes')),
      );

      expect(result).toEqual([
        {
          pageNumber: 1,
          text: 'EXCELENTISSIMO SENHOR\nDOS FATOS narrados na inicial',
        },
        {
          pageNumber: 2,
          text: 'DOS PEDIDOS\nPEDE DEFERIMENTO',
        },
      ]);
    });

    it('should fall back to a single PDF page when there are no page markers', async () => {
      const rawText =
        'Texto extraído do PDF sem marcadores de página e com tamanho suficiente';
      PDFParseMock.mockImplementation(() => ({
        getText: jest
          .fn<() => Promise<{ text: string }>>()
          .mockResolvedValue({ text: rawText }),
      }));

      const result = await service.extractPages(
        makeFile('processo.pdf', Buffer.from('pdf bytes')),
      );

      expect(result).toEqual([
        {
          pageNumber: 1,
          text: rawText,
        },
      ]);
    });

    it('should throw BadRequestException when there is no buffer or path', async () => {
      const file = {
        ...makeFile('processo.txt'),
        buffer: undefined,
        path: '',
      } as unknown as Express.Multer.File;

      await expect(service.extractPages(file)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
