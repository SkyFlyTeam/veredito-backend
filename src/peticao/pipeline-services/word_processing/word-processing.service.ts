/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { ExtractedPage } from 'src/processo/types/extracted-page.type';

// pdf-parse v2 exports a PDFParse class instead of a plain function.
// We use require() because the package is CJS-only and has no proper TS typings.
const { PDFParse } = require('pdf-parse');

export const ALLOWED_MIMETYPES = [
  'application/pdf', // PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'text/plain', // TXT
];

export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];

@Injectable()
export class WordProcessingService {
  /**
   * Main public method of the service.
   * Receives an uploaded file (Express.Multer.File), validates its extension
   * and delegates text extraction to the corresponding private method.
   *
   * @param file - File received by Multer (contains: originalname, buffer, mimetype, etc.)
   * @returns Promise<string> - Raw text extracted from the file
   */
  async extractText(file: Express.Multer.File): Promise<string> {
    // Extracts the extension from the original file name (e.g. "report.pdf" → "pdf").
    // split('.') splits the string by the dot → ["report", "pdf"]
    // .pop() gets the last element → "pdf"
    // ?.toLowerCase() safely converts to lowercase (in case pop() returns undefined)
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    // Validates whether the extension exists and is in the allowed list.
    // Otherwise, throws BadRequestException (HTTP 400) with an explanatory message.
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado. Formatos aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    // Routes the file buffer to the correct parser based on the extension.
    // The buffer is the binary content of the file already read into memory by Multer.
    switch (extension) {
      case 'pdf':
        return this.parsePdf(file.buffer);
      case 'docx':
        return this.parseDocx(file.buffer);
      case 'txt':
        return this.parseTxt(file.buffer);
      // The default case will never be reached in practice (the validation above guarantees that),
      // but it is good practice to include it to cover all cases in the switch.
      default:
        throw new BadRequestException(
          `Unsupported file type. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        );
    }
  }

  async extractTextFromPath(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`Arquivo não encontrado: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const originalname = path.basename(filePath);
    const extension = originalname.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado. Formatos aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    switch (extension) {
      case 'pdf':
        return this.parsePdf(buffer);
      case 'docx':
        return this.parseDocx(buffer);
      case 'txt':
        return this.parseTxt(buffer);
      default:
        throw new BadRequestException(
          `Unsupported file type. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        );
    }
  }

  /**
   * Extracts raw text from a PDF file.
   * Uses the pdf-parse library, which reads the binary buffer and returns the text inside the PDF.
   *
   * @param buffer - Binary content of the PDF file
   * @returns Promise<string> - Extracted text
   */
  private async parsePdf(buffer: Buffer): Promise<string> {
    // PDFParse v2 is instantiated with { data: buffer }, then .getText() is called.
    // result.text contains the concatenated raw text from all pages.
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    // Remove page number lines that match the pattern: "-- 1 of 3 --" added automatically by the pdf parser
    const cleanedText = result.text.replace(
      /^.*--\s*\d+\s+of\s+\d+\s*--.*$\n?/gim,
      '',
    );

    if (!cleanedText || cleanedText.length < 50) {
      throw new Error(
        'PDF é uma imagem escaneada ou está vazio. Por favor envie outro PDF com texto legível.',
      );
    }

    return cleanedText;
  }

  /**
   * Extracts raw text from a DOCX (Word) file.
   * Uses the mammoth library, which was built specifically to convert DOCX to text/HTML.
   *
   * @param buffer - Binary content of the DOCX file
   * @returns Promise<string> - Extracted text
   */
  private async parseDocx(buffer: Buffer): Promise<string> {
    // extractRawText ignores formatting, styles and images, returning only plain text.
    // "result.value" contains the text; "result.messages" contains conversion warnings (ignored here).
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  /**
   * Extracts text from a TXT file.
   * Since TXT is already plain text, it only needs to convert the binary buffer to a string using UTF-8 encoding.
   *
   * @param buffer - Binary content of the TXT file
   * @returns string - File content as text
   */
  private parseTxt(buffer: Buffer): string {
    // Buffer.toString('utf-8') converts bytes to string while preserving special characters (accents, etc.)
    let text = buffer.toString('utf-8');

    // Strip UTF-8 BOM (Byte Order Mark: \uFEFF) if present at the start of the file.
    // Some editors (e.g. Word, Notepad on Windows) add it automatically.
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    // Normalize line endings to LF (\n):
    // - CRLF (\r\n) → LF  (Windows style)
    // - CR only (\r)  → LF  (old Mac OS style — causes terminal overwrite if left as-is)
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    return text;
  }

  private async extractPagesFromBuffer(
    originalname: string,
    buffer: Buffer,
  ): Promise<ExtractedPage[]> {
    const extension = originalname.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado. Formatos aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    switch (extension) {
      case 'pdf':
        return this.parsePdfPages(buffer);

      case 'docx': {
        const text = await this.parseDocx(buffer);
        return [
          {
            pageNumber: 1,
            text,
          },
        ];
      }

      case 'txt': {
        const text = this.parseTxt(buffer);
        return [
          {
            pageNumber: 1,
            text,
          },
        ];
      }

      default:
        throw new BadRequestException(
          `Unsupported file type. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        );
    }
  }

  private async parsePdfPages(buffer: Buffer): Promise<ExtractedPage[]> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Buffer do PDF está vazio ou inválido.');
    }

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const rawText = result.text;

    if (!rawText || rawText.length < 50) {
      throw new Error(
        'PDF é uma imagem escaneada ou está vazio. Por favor envie outro PDF com texto legível.',
      );
    }

    const pages = this.splitPdfParseTextIntoPages(rawText);

    if (pages.length === 0) {
      return [
        {
          pageNumber: 1,
          text: rawText,
        },
      ];
    }

    return pages;
  }

  private splitPdfParseTextIntoPages(text: string): ExtractedPage[] {
    const pageMarkerRegex = /--\s*(\d+)\s+of\s+(\d+)\s*--/gi;

    const matches = Array.from(text.matchAll(pageMarkerRegex));

    if (matches.length === 0) {
      return [];
    }

    const pages: ExtractedPage[] = [];

    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];

      const pageNumber = Number(currentMatch[1]);

      const startIndex = currentMatch.index + currentMatch[0].length;
      const endIndex = nextMatch?.index ?? text.length;

      const pageText = text.slice(startIndex, endIndex).trim();

      pages.push({
        pageNumber,
        text: pageText,
      });
    }

    return pages;
  }

  async extractPagesFromPath(filePath: string): Promise<ExtractedPage[]> {
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`Arquivo não encontrado: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const originalname = path.basename(filePath);
    const extension = originalname.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado. Formatos aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    switch (extension) {
      case 'pdf':
        return this.parsePdfPages(buffer);

      case 'docx': {
        const text = await this.parseDocx(buffer);
        return [
          {
            pageNumber: 1,
            text,
          },
        ];
      }

      case 'txt': {
        const text = this.parseTxt(buffer);
        return [
          {
            pageNumber: 1,
            text,
          },
        ];
      }

      default:
        throw new BadRequestException(
          `Unsupported file type. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
        );
    }
  }

  async extractPages(file: Express.Multer.File): Promise<ExtractedPage[]> {
    if (file.buffer) {
      return this.extractPagesFromBuffer(file.originalname, file.buffer);
    }

    if (file.path) {
      return this.extractPagesFromPath(file.path);
    }

    throw new BadRequestException(
      'Arquivo inválido: não foi encontrado buffer nem caminho do arquivo.',
    );
  }
}
