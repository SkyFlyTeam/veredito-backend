import { BadRequestException, Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';

// pdf-parse v2 exports a PDFParse class instead of a plain function.
// We use require() because the package is CJS-only and has no proper TS typings.
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
    return result.text;
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
}
