/**
 * Script para testar o ProcessInformationService isoladamente.
 *
 * Lê as peças processuais da pasta dev-tools/data/processo-pecas,
 * extrai o texto de cada PDF e chama o ProcessInformationService
 * (GPT-4o-mini) para extrair fatos, pedidos e fundamentos jurídicos.
 *
 * Executa dois cenários em sequência:
 *   Cenário 1 — Apenas petição inicial
 *   Cenário 2 — Todas as peças (petição + contestação + sentença + recurso)
 *
 * Requer OPENAI_API_KEY no ambiente.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register dev-tools/test-process-information.ts
 */

import 'dotenv/config';
import * as path from 'path';
import { WordProcessingService } from '../src/peticao/pipeline-services/word_processing/word-processing.service';
import { ProcessInformationService } from '../src/processo/service/process-information.service';
import { ProcessPieces } from '../src/processo/types/process-pieces.type';
import { ProcessInformation } from '../src/processo/types/process-information.type';
import { ConfigService } from '@nestjs/config';

const PECAS_DIR = path.resolve(__dirname, 'data', 'processo-pecas');

const FILES = {
  peticao:     '01_Peticao_Inicial.pdf',
  contestacao: '02_Contestacao_Defesa_Informacoes.pdf',
  sentenca:    '03_Sentenca.pdf',
  recurso:     '04_Recurso_Embargos_Apelacao_RE_REsp.pdf',
};

function printSeparator(char = '─', width = 80) {
  console.log(char.repeat(width));
}

function printResult(label: string, result: ProcessInformation) {
  printSeparator('═');
  console.log(`RESULTADO — ${label}`);
  printSeparator('═');

  console.log('\nFATOS:');
  printSeparator();
  console.log(result.fatos);
  console.log(`\n→ Parágrafos: ${result.fatos.split('\n\n').filter(Boolean).length}`);

  console.log('\nPEDIDOS:');
  printSeparator();
  console.log(result.pedidos);
  console.log(`\n→ Parágrafos: ${result.pedidos.split('\n\n').filter(Boolean).length}`);

  console.log('\nFUNDAMENTOS JURÍDICOS:');
  printSeparator();
  console.log(result.fundamentosJuridicos);
  console.log(`\n→ Parágrafos: ${result.fundamentosJuridicos.split('\n\n').filter(Boolean).length}`);

  printSeparator('═');
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY não definida. Verifique o .env');
    process.exit(1);
  }

  const wordService = new WordProcessingService();
  const configService = new ConfigService({ OPENAI_API_KEY: process.env.OPENAI_API_KEY });
  const service = new ProcessInformationService(configService);

  // ─── Extração de texto dos PDFs ───────────────────────────────────────────
  console.log('\n[Preparando] Extraindo texto das peças processuais...\n');

  const peticaoPath    = path.join(PECAS_DIR, FILES.peticao);
  const contestacaoPath = path.join(PECAS_DIR, FILES.contestacao);
  const sentencaPath   = path.join(PECAS_DIR, FILES.sentenca);
  const recursoPath    = path.join(PECAS_DIR, FILES.recurso);

  const [peticao, contestacao, sentenca, recurso] = await Promise.all([
    wordService.extractTextFromPath(peticaoPath),
    wordService.extractTextFromPath(contestacaoPath),
    wordService.extractTextFromPath(sentencaPath),
    wordService.extractTextFromPath(recursoPath),
  ]);

  console.log(`  ✔ Petição inicial   : ${peticao.length} caracteres`);
  console.log(`  ✔ Contestação       : ${contestacao.length} caracteres`);
  console.log(`  ✔ Sentença          : ${sentenca.length} caracteres`);
  console.log(`  ✔ Recurso           : ${recurso.length} caracteres`);

  // ─── CENÁRIO 1: Apenas petição inicial ────────────────────────────────────
  printSeparator('═');
  console.log('CENÁRIO 1 — Apenas petição inicial');
  printSeparator('═');
  console.log('Enviando para o GPT-4o-mini...\n');

  const pieces1: ProcessPieces = { peticao };
  const result1 = await service.extractInformation(pieces1);
  printResult('Apenas Petição Inicial', result1);

  // ─── CENÁRIO 2: Todas as peças ─────────────────────────────────────────────
  printSeparator('═');
  console.log('CENÁRIO 2 — Todas as peças (petição + contestação + sentença + recurso)');
  printSeparator('═');
  console.log('Enviando para o GPT-4o-mini...\n');

  const pieces2: ProcessPieces = {
    peticao,
    contestacao: contestacao,
    sentenca,
    recurso,
  };
  const result2 = await service.extractInformation(pieces2);
  printResult('Todas as Peças', result2);
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
