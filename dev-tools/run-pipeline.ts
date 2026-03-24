/**
 * Pipeline evaluation script.
 *
 * Runs the full pipeline (text extraction → NLP processing) on a given file
 * and prints a side-by-side report.
 *
 * Usage:
 *   npx ts-node dev-tools/run-pipeline.ts <filename>
 *
 * Examples:
 *   npx ts-node dev-tools/run-pipeline.ts example-1.docx
 *   npx ts-node dev-tools/run-pipeline.ts example-2.pdf
 *   npx ts-node dev-tools/run-pipeline.ts example-3.txt
 *
 * The filename is resolved relative to dev-tools/data/.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Bootstrap services without the NestJS IoC container ──────────────────────
import { WordProcessingService } from '../src/peticao/pipeline-services/word_processing/word-processing.service';
import { TextProcessingService } from '../src/peticao/pipeline-services/word_processing/text-processing.service';
import { PipelineOrchestrator } from '../src/peticao/pipeline-services/pipeline_orchestror';

const wordService = new WordProcessingService();
const textService = new TextProcessingService();
const orchestrator = new PipelineOrchestrator(wordService, textService);

// ── Helpers ───────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve(__dirname, 'data');

const MIMETYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

function buildFakeMulterFile(filePath: string): Express.Multer.File {
  const buffer = fs.readFileSync(filePath);
  const originalname = path.basename(filePath);
  const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
  const mimetype = MIMETYPE_MAP[ext] ?? 'application/octet-stream';

  return {
    buffer,
    originalname,
    mimetype,
    fieldname: 'file',
    encoding: '7bit',
    size: buffer.length,
    stream: null as any,
    destination: '',
    filename: originalname,
    path: filePath,
  };
}

function printSeparator(char = '─', width = 80) {
  console.log(char.repeat(width));
}

function preview(text: string, maxChars = 400): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > maxChars ? clean.slice(0, maxChars) + ' …' : clean;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.error('Usage: npx ts-node dev-tools/run-pipeline.ts <filename>');
    console.error('Example: npx ts-node dev-tools/run-pipeline.ts example-1.docx');
    process.exit(1);
  }

  // Resolve relative to dev-tools/data/ if not an absolute path
  const filePath = path.isAbsolute(arg)
    ? arg
    : path.resolve(DATA_DIR, arg);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  const multerFile = buildFakeMulterFile(filePath);

  printSeparator('═');
  console.log(`FILE: ${filename}`);
  printSeparator('═');

  try {
    const { rawText, processedText } = await orchestrator.run(multerFile);

    console.log('\n[RAW TEXT — first 400 chars]');
    printSeparator();
    console.log(preview(rawText));

    console.log('\n[PROCESSED TEXT — first 400 chars]');
    printSeparator();
    console.log(preview(processedText));

    const rawTokens = rawText.trim().split(/\s+/).length;
    const processedTokens = processedText.trim()
      ? processedText.trim().split(/\s+/).length
      : 0;

    console.log('\n[STATS]');
    printSeparator();
    console.log(`  Raw tokens      : ${rawTokens}`);
    console.log(`  Processed tokens: ${processedTokens}`);
    console.log(
      `  Reduction       : ${(((rawTokens - processedTokens) / rawTokens) * 100).toFixed(1)}%`,
    );
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
    process.exit(1);
  }

  console.log();
}

main().catch(console.error);
