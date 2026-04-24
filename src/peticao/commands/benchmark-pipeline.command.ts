import * as fs from 'fs';
import * as path from 'path';
import { Command, CommandRunner } from 'nest-commander';
import { WordProcessingService } from '../pipeline-services/word_processing/word-processing.service';
import { TextProcessingService } from '../pipeline-services/word_processing/text-processing.service';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { SummaryService } from '../pipeline-services/summary/summary.service';
import { SemanticSearchService } from '../semantic-search/service/semantic-search.service';

const DATA_DIR = path.resolve(process.cwd(), 'dev-tools', 'data');

interface BenchmarkCase {
  filename: string;
  gabarito: string;
}

interface RunMetrics {
  inputChars: number;
  embeddingTokens: number;
  summaryTokens: number;
  summaryTimeMs: number;
  embeddingTimeMs: number;
  searchTimeMs: number;
  totalTimeMs: number;
  topResults: string[];
  hitRank: number | null;
}

interface BenchmarkRow {
  index: number;
  filename: string;
  gabarito: string;
  modeA: RunMetrics;
  modeB: RunMetrics;
}

const BENCHMARK_CASES: BenchmarkCase[] = [
  { filename: '1_acao_cobranca_lei_12855_tema_repetitivo_974_SIRDR_3_STJ.pdf', gabarito: 'stj-rr-974' },
  { filename: '2_acao_ popular_competencia_originaria_TJES_IRDR_85.pdf', gabarito: 'tjes-irdr-85' },
  { filename: '3_competencia_juri_foro_privilegiado_CE_SV_45_STF.pdf', gabarito: 'stf-sv-45' },
  { filename: '4_inicial_alimentos_complementares_litisconsorcio_avos_tema_1310_com_suspensao.pdf', gabarito: 'stj-rr-1310' },
  { filename: '5_inicial_cobranca_taxa_matricula_universidade_publica_tema_RG_40.pdf', gabarito: 'stf-rg-40' },
  { filename: '6_inicial_competencia_criminal_menor_violencia_domestica_IRDR_TJES_77.pdf', gabarito: 'tjes-irdr-77' },
  { filename: '7_inicial_correcao_FGTS_piso_salario_minimo_ADI_5090.pdf', gabarito: 'stf-adi-5090' },
  { filename: '8_inicial_cotista_lista_ampla _concorrencia_IRDR_TJES_106.pdf', gabarito: 'tjes-irdr-106' },
  { filename: '9_inicial_deducao_juros_JCP_CSLL_tema _repetitivo_1319_STJ_TEM_SUSPENSAO.pdf', gabarito: 'stj-rr-1319' },
  { filename: '10_inicial_fracionamento_precatorio_tema_28_STF.pdf', gabarito: 'stf-rg-28' },
];

@Command({
  name: 'benchmark:pipeline',
  description:
    'Compara métricas entre pipeline com texto completo (Modo A) e com resumo (Modo B) para 10 petições. ' +
    'NÃO persiste dados no banco — apenas lê e consulta. ' +
    'Uso: docker compose run --rm app npm run start:cli -- benchmark:pipeline',
})
export class BenchmarkPipelineCommand extends CommandRunner {
  constructor(
    private readonly wordService: WordProcessingService,
    private readonly textService: TextProcessingService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly summaryService: SummaryService,
    private readonly semanticSearch: SemanticSearchService,
  ) {
    super();
  }

  async run(): Promise<void> {
    this.sep('═');
    console.log('  BENCHMARK: Texto Completo (A) vs Resumo (B)');
    console.log(`  Data: ${new Date().toISOString()}`);
    this.sep('═');
    console.log();

    const rows: BenchmarkRow[] = [];

    for (let i = 0; i < BENCHMARK_CASES.length; i++) {
      const c = BENCHMARK_CASES[i];
      const filePath = path.join(DATA_DIR, c.filename);

      if (!fs.existsSync(filePath)) {
        console.error(`[SKIP] Arquivo não encontrado: ${c.filename}`);
        continue;
      }

      console.log(`[${i + 1}/10] ${c.filename}`);
      console.log(`       gabarito: ${c.gabarito}`);

      let rawText: string;
      try {
        rawText = await this.wordService.extractTextFromPath(filePath);
      } catch (err) {
        console.error(`       [ERRO] Extração falhou: ${(err as Error).message}`);
        continue;
      }

      // ── Modo A — Texto completo ───────────────────────────────────────────
      console.log('       → Modo A (texto completo)...');
      const modeA = await this.runModeA(rawText, c.gabarito);
      console.log(`         tokens embedding: ${modeA.embeddingTokens} | tempo total: ${modeA.totalTimeMs}ms | rank: ${modeA.hitRank ?? 'não encontrado'}`);

      // ── Modo B — Resumo ───────────────────────────────────────────────────
      console.log('       → Modo B (resumo)...');
      const modeB = await this.runModeB(rawText, c.gabarito);
      console.log(`         tokens summary: ${modeB.summaryTokens} | tokens embedding: ${modeB.embeddingTokens} | tempo total: ${modeB.totalTimeMs}ms | rank: ${modeB.hitRank ?? 'não encontrado'}`);
      console.log();

      rows.push({ index: i + 1, filename: c.filename, gabarito: c.gabarito, modeA, modeB });
    }

    this.printReport(rows);
  }

  // ── Modo A: texto completo → NLP → embedding → busca ──────────────────────

  private async runModeA(rawText: string, gabarito: string): Promise<RunMetrics> {
    const t0 = Date.now();

    const processed = this.textService.process(rawText);
    const textForEmbedding = processed.replace(/\s+/g, ' ').trim().slice(0, 3000);

    const tEmb0 = Date.now();
    const { embedding, tokens: embeddingTokens } = await this.embeddingsService.generateEmbeddingWithMetrics(textForEmbedding);
    const embeddingTimeMs = Date.now() - tEmb0;

    const tSearch0 = Date.now();
    const results = await this.semanticSearch.searchSimilar(embedding);
    const searchTimeMs = Date.now() - tSearch0;

    const topResults: string[] = results.map((r: any) => r.numero_registro as string);
    const hitIndex = topResults.indexOf(gabarito);

    return {
      inputChars: textForEmbedding.length,
      embeddingTokens,
      summaryTokens: 0,
      summaryTimeMs: 0,
      embeddingTimeMs,
      searchTimeMs,
      totalTimeMs: Date.now() - t0,
      topResults,
      hitRank: hitIndex >= 0 ? hitIndex + 1 : null,
    };
  }

  // ── Modo B: texto completo → resumo GPT → NLP → embedding → busca ─────────

  private async runModeB(rawText: string, gabarito: string): Promise<RunMetrics> {
    const t0 = Date.now();

    const summary = await this.summaryService.summarizeWithMetrics(rawText);
    const summaryText = `${summary.teseJuridica} ${summary.solicitacaoPedido}`;

    const processed = this.textService.process(summaryText);
    const textForEmbedding = processed.replace(/\s+/g, ' ').trim().slice(0, 3000);

    const tEmb0 = Date.now();
    const { embedding, tokens: embeddingTokens } = await this.embeddingsService.generateEmbeddingWithMetrics(textForEmbedding);
    const embeddingTimeMs = Date.now() - tEmb0;

    const tSearch0 = Date.now();
    const results = await this.semanticSearch.searchSimilar(embedding);
    const searchTimeMs = Date.now() - tSearch0;

    const topResults: string[] = results.map((r: any) => r.numero_registro as string);
    const hitIndex = topResults.indexOf(gabarito);

    return {
      inputChars: textForEmbedding.length,
      embeddingTokens,
      summaryTokens: summary.totalTokens,
      summaryTimeMs: summary.elapsedMs,
      embeddingTimeMs,
      searchTimeMs,
      totalTimeMs: Date.now() - t0,
      topResults,
      hitRank: hitIndex >= 0 ? hitIndex + 1 : null,
    };
  }

  // ── Relatório ──────────────────────────────────────────────────────────────

  private printReport(rows: BenchmarkRow[]): void {
    const hit = (rank: number | null) => rank !== null ? '✅' : '❌';
    const col = (s: string, w: number) => s.substring(0, w).padEnd(w);

    // ── Tabela de aplicabilidade ─────────────────────────────────────────────
    this.sep('═');
    console.log('  APLICABILIDADE — O gabarito apareceu nos top-10 sugeridos?');
    this.sep('═');
    console.log(
      col('#', 4) +
      col('Gabarito esperado', 22) +
      col('Texto completo (A)', 22) +
      col('Resumo (B)', 18) +
      col('Mudança', 12),
    );
    this.sep('-');

    let hitsA = 0;
    let hitsB = 0;
    let totalEmbTokA = 0;
    let totalEmbTokB = 0;
    let totalSumTokB = 0;
    let totalMsA = 0;
    let totalMsB = 0;

    for (const r of rows) {
      const aplA = hit(r.modeA.hitRank);
      const aplB = hit(r.modeB.hitRank);
      const rankA = r.modeA.hitRank ? `rank #${r.modeA.hitRank}` : 'não encontrado';
      const rankB = r.modeB.hitRank ? `rank #${r.modeB.hitRank}` : 'não encontrado';

      let mudanca: string;
      if (!r.modeA.hitRank && r.modeB.hitRank) mudanca = '↑ ganhou acerto';
      else if (r.modeA.hitRank && !r.modeB.hitRank) mudanca = '↓ perdeu acerto';
      else if (r.modeA.hitRank && r.modeB.hitRank && r.modeB.hitRank < r.modeA.hitRank) mudanca = `↑ melhorou rank`;
      else if (r.modeA.hitRank && r.modeB.hitRank && r.modeB.hitRank > r.modeA.hitRank) mudanca = `↓ piorou rank`;
      else mudanca = '= igual';

      if (r.modeA.hitRank) hitsA++;
      if (r.modeB.hitRank) hitsB++;
      totalEmbTokA += r.modeA.embeddingTokens;
      totalEmbTokB += r.modeB.embeddingTokens;
      totalSumTokB += r.modeB.summaryTokens;
      totalMsA += r.modeA.totalTimeMs;
      totalMsB += r.modeB.totalTimeMs;

      console.log(
        col(String(r.index), 4) +
        col(r.gabarito, 22) +
        col(`${aplA} ${rankA}`, 22) +
        col(`${aplB} ${rankB}`, 18) +
        col(mudanca, 12),
      );
    }

    this.sep('-');
    console.log();

    // ── Tabela de métricas ───────────────────────────────────────────────────
    this.sep('═');
    console.log('  MÉTRICAS — Tokens e tempo por petição');
    this.sep('═');
    console.log(
      col('#', 4) +
      col('Gabarito', 22) +
      col('A: chars', 10) +
      col('A: emb tok', 12) +
      col('A: ms', 9) +
      col('B: sum tok', 12) +
      col('B: emb tok', 12) +
      col('B: ms', 9),
    );
    this.sep('-');

    for (const r of rows) {
      console.log(
        col(String(r.index), 4) +
        col(r.gabarito, 22) +
        col(String(r.modeA.inputChars), 10) +
        col(String(r.modeA.embeddingTokens), 12) +
        col(`${r.modeA.totalTimeMs}ms`, 9) +
        col(String(r.modeB.summaryTokens), 12) +
        col(String(r.modeB.embeddingTokens), 12) +
        col(`${r.modeB.totalTimeMs}ms`, 9),
      );
    }

    this.sep('-');
    console.log();

    // ── Detalhamento top-10 ──────────────────────────────────────────────────
    this.sep('═');
    console.log('  DETALHAMENTO — Top-10 retornados por petição');
    this.sep('═');
    for (const r of rows) {
      const aplA = hit(r.modeA.hitRank);
      const aplB = hit(r.modeB.hitRank);
      console.log(`\n[${r.index}] ${r.gabarito}`);
      console.log(`  Modo A ${aplA}: ${r.modeA.topResults.map((nr, i) => nr === r.gabarito ? `[${nr}*]` : nr).join(', ')}`);
      console.log(`  Modo B ${aplB}: ${r.modeB.topResults.map((nr, i) => nr === r.gabarito ? `[${nr}*]` : nr).join(', ')}`);
    }

    // Estatísticas finais
    console.log();
    this.sep('═');
    console.log('  RESUMO ESTATÍSTICO');
    this.sep('═');
    const n = rows.length;
    const taxaA = ((hitsA / n) * 100).toFixed(0);
    const taxaB = ((hitsB / n) * 100).toFixed(0);

    console.log(`  Petições avaliadas : ${n}`);
    console.log();
    console.log(`  Modo A — Texto Completo`);
    console.log(`    Taxa de acerto     : ${hitsA}/${n} (${taxaA}%)`);
    console.log(`    Tokens embedding   : ${totalEmbTokA} total (média ${(totalEmbTokA / n).toFixed(0)}/petição)`);
    console.log(`    Tempo total        : ${totalMsA}ms (média ${(totalMsA / n).toFixed(0)}ms/petição)`);
    console.log();
    console.log(`  Modo B — Resumo (GPT-4o-mini + text-embedding-3-small)`);
    console.log(`    Taxa de acerto     : ${hitsB}/${n} (${taxaB}%)`);
    console.log(`    Tokens summary     : ${totalSumTokB} total (média ${(totalSumTokB / n).toFixed(0)}/petição)`);
    console.log(`    Tokens embedding   : ${totalEmbTokB} total (média ${(totalEmbTokB / n).toFixed(0)}/petição)`);
    console.log(`    Tokens totais (B)  : ${totalSumTokB + totalEmbTokB} total`);
    console.log(`    Tempo total        : ${totalMsB}ms (média ${(totalMsB / n).toFixed(0)}ms/petição)`);
    console.log();

    // Veredicto
    let veredicto: string;
    if (hitsB > hitsA) veredicto = '✅ EFICAZ — Taxa de acerto aumentou';
    else if (hitsB === hitsA) veredicto = '⚖️  NEUTRO — Taxa de acerto permaneceu a mesma';
    else veredicto = '❌ INEFICAZ — Taxa de acerto diminuiu';

    console.log(`  VEREDICTO: ${veredicto}`);
    this.sep('═');
    console.log();
  }

  private sep(char = '─', width = 100) {
    console.log(char.repeat(width));
  }
}
