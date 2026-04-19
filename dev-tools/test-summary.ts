/**
 * Script para testar o SummaryService isoladamente.
 *
 * Lê um arquivo de petição, extrai o texto e chama o SummaryService
 * (GPT-4o-mini) para gerar o resumo com tese jurídica e pedido.
 *
 * Requer OPENAI_API_KEY no ambiente.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register dev-tools/test-summary.ts <filename>
 *
 * Exemplos:
 *   npx ts-node -r tsconfig-paths/register dev-tools/test-summary.ts example-3.txt
 *   npx ts-node -r tsconfig-paths/register dev-tools/test-summary.ts example-2.pdf
 *   npx ts-node -r tsconfig-paths/register dev-tools/test-summary.ts example-1.docx
 *
 * O filename é resolvido relativamente a dev-tools/data/.
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { WordProcessingService } from '../src/peticao/pipeline-services/word_processing/word-processing.service';
import { SummaryService } from '../src/peticao/pipeline-services/summary/summary.service';

const DATA_DIR = path.resolve(__dirname, 'data');

function printSeparator(char = '─', width = 80) {
  console.log(char.repeat(width));
}

async function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.error('Uso: npx ts-node -r tsconfig-paths/register dev-tools/test-summary.ts <filename>');
    process.exit(1);
  }

  const filePath = path.isAbsolute(arg) ? arg : path.resolve(DATA_DIR, arg);

  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY não definida. Verifique o .env');
    process.exit(1);
  }

  const wordService = new WordProcessingService();
  const summaryService = new SummaryService();

  printSeparator('═');
  console.log(`ARQUIVO: ${path.basename(filePath)}`);
  printSeparator('═');

  console.log('\n[1/2] Extraindo texto do arquivo...');
  const rawText = await wordService.extractTextFromPath(filePath);
  console.log(`Texto extraído: ${rawText.length} caracteres`);
  console.log('\nPrévia do texto:');
  printSeparator();
  console.log(rawText.replace(/\s+/g, ' ').trim().slice(0, 500) + (rawText.length > 500 ? ' …' : ''));
  printSeparator();

  console.log('\n[2/2] Gerando resumo com GPT-4o-mini...');
  const summary = await summaryService.summarize(rawText);

  printSeparator('═');
  console.log('RESULTADO DO RESUMO');
  printSeparator('═');

  console.log('\nTESE JURÍDICA:');
  printSeparator();
  console.log(summary.teseJuridica);
  console.log(`\n→ Linhas reais (\\n): ${summary.teseJuridica.split('\n').length}`);

  console.log('\nSOLICITAÇÃO/PEDIDO:');
  printSeparator();
  console.log(summary.solicitacaoPedido);
  console.log(`\n→ Linhas reais (\\n): ${summary.solicitacaoPedido.split('\n').length}`);

  printSeparator('═');
  console.log('MÉTRICAS');
  printSeparator('═');
  console.log(`Tempo de processamento : ${summary.usage.elapsedMs} ms`);
  console.log(`Tokens de entrada      : ${summary.usage.promptTokens}`);
  console.log(`Tokens de saída        : ${summary.usage.completionTokens}`);
  console.log(`Total de tokens        : ${summary.usage.totalTokens}`);
  printSeparator('═');
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
