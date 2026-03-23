/**
 * Standalone script to manually test FileConverterService with a real file.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts <path-to-file>
 *
 * Examples:
 *   npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts ./my-document.pdf
 *   npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts ./contract.docx
 *   npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts ./notes.txt
 */

import * as fs from 'fs';
import * as path from 'path';
import { WordProcessingService } from '../src/peticao/pipeline-services/word_processing/word-processing.service';

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts <path-to-file>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(absolutePath);
  const originalname = path.basename(absolutePath);

  // Build a minimal Multer file object (same shape the service expects)
  const file = {
    originalname,
    buffer,
    mimetype: '',
    fieldname: 'file',
    encoding: '7bit',
    size: buffer.length,
  } as Express.Multer.File;

  const service = new WordProcessingService();

  console.log(`\nParsing file: ${originalname} (${buffer.length} bytes)\n`);

  try {
    const text = await service.extractText(file);
    console.log('--- Extracted text ---\n');
    console.log(text);
    console.log('\n--- End of text ---');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
