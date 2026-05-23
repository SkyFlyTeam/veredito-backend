/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WordProcessingService } from '../../peticao/pipeline-services/word_processing/word-processing.service';
import { CasoJuridicoInformations } from '../dto/caso-juridico-informations.dto';

// OpenAI usa require() pelo mesmo motivo do pdf-parse: evita problemas de
// resolução de tipos em projetos com moduleResolution mais restrito.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OpenAI = require('openai').default ?? require('openai');

/** Resposta bruta esperada do modelo */
interface GptExtractionResponse {
  fatosEstruturados: string;
  fundamentosJuridicos: string;
}

@Injectable()
export class CasoJuridicoExtractionService {
  private readonly logger = new Logger(CasoJuridicoExtractionService.name);
  private readonly openai: any;

  // Limites de parágrafo definidos nos critérios de aceitação
  private readonly MIN_PARAGRAPHS = 1;
  private readonly MAX_PARAGRAPHS = 5;

  constructor(
    private readonly configService: ConfigService,
    private readonly wordProcessingService: WordProcessingService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Recebe múltiplos arquivos (PDF, DOCX ou TXT), extrai o texto de cada um,
   * concatena e envia ao GPT-4o para identificar fatos estruturados e fundamentos jurídicos.
   *
   * @param files - Array de arquivos recebidos pelo Multer
   * @returns CasoJuridicoInformations com fatos e fundamentos extraídos
   */
  async extractFromDocuments(files: any[]): Promise<CasoJuridicoInformations> {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Nenhum arquivo enviado. Envie ao menos um documento jurídico.',
      );
    }

    // ── Passo 1: extrair texto de cada arquivo ───────────────────────────────
    const textsWithSource: string[] = [];

    for (const file of files) {
      try {
        const text: string = await this.wordProcessingService.extractText(file);

        if (!text || text.trim().length < 30) {
          this.logger.warn(
            `Arquivo "${file.originalname}" ignorado: texto extraído muito curto ou vazio.`,
          );
          continue;
        }

        // Inclui separador identificando a origem para ajudar o modelo a correlacionar documentos
        textsWithSource.push(
          `=== DOCUMENTO: ${file.originalname} ===\n${text.trim()}`,
        );
        this.logger.log(
          `Texto extraído de "${file.originalname}" (${text.length} caracteres).`,
        );
      } catch (err) {
        // Arquivo inválido ou não suportado — ignora e loga
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Arquivo "${file.originalname}" ignorado: ${message}`);
      }
    }

    if (textsWithSource.length === 0) {
      throw new UnsupportedMediaTypeException(
        'Nenhum dos arquivos enviados pôde ser processado. ' +
          'Certifique-se de enviar documentos jurídicos válidos nos formatos PDF, DOCX ou TXT.',
      );
    }

    // ── Passo 2: montar o corpus textual ────────────────────────────────────
    // GPT-4o suporta ~128k tokens; limitamos a 80.000 caracteres (~60k tokens)
    // para garantir espaço de resposta adequado.
    const MAX_CORPUS_CHARS = 80_000;
    const corpus = textsWithSource.join('\n\n').substring(0, MAX_CORPUS_CHARS);

    this.logger.log(
      `Corpus montado com ${textsWithSource.length} documento(s) — ${corpus.length} caracteres.`,
    );

    // ── Passo 3: chamar o GPT-4o ─────────────────────────────────────────────
    return this.callGpt(corpus);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Métodos privados
  // ────────────────────────────────────────────────────────────────────────────

  private async callGpt(corpus: string): Promise<CasoJuridicoInformations> {
    const systemPrompt = `Você é um assistente jurídico especializado em análise documental.
Sua tarefa é analisar documentos jurídicos e extrair duas seções obrigatórias:

1. **fatosEstruturados** — Narrativa objetiva e cronológica dos fatos relevantes ao caso.
   Descreva quem são as partes, o que aconteceu, quando e quais circunstâncias são juridicamente relevantes.
   Baseie-se estritamente nos documentos. Não invente fatos.

2. **fundamentosJuridicos** — Fundamentos legais aplicáveis: artigos de lei, princípios constitucionais,
   súmulas, jurisprudência ou doutrina mencionados ou claramente inferíveis dos documentos.
   Inclua o dispositivo legal e uma breve explicação de sua pertinência ao caso.

Regras de formatação:
- Cada seção deve ter entre ${this.MIN_PARAGRAPHS} e ${this.MAX_PARAGRAPHS} parágrafos.
- Um parágrafo equivale a, no mínimo, 5 linhas de texto corrido.
- Linguagem jurídica, técnica e objetiva. Sem listas ou bullet points.
- Se alguma seção não puder ser identificada nos documentos, informe isso claramente dentro do campo.

Responda EXCLUSIVAMENTE em JSON válido, sem markdown, sem backticks, sem texto fora do JSON:
{
  "fatosEstruturados": "...",
  "fundamentosJuridicos": "..."
}`;

    const userPrompt = `Analise os documentos abaixo e extraia os fatos estruturados e fundamentos jurídicos conforme as instruções.\n\n${corpus}`;

    this.logger.log('Enviando corpus ao GPT-4o para extração jurídica...');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // baixa temperatura → respostas mais determinísticas e factuais
      max_tokens: 2048,
      response_format: { type: 'json_object' }, // força saída JSON puro
    });

    const rawContent: string = response.choices[0]?.message?.content ?? '';
    this.logger.log(`Extração concluída com sucesso.`);
    return this.parseAndValidate(rawContent);
  }

  /**
   * Faz parse do JSON retornado pelo GPT e valida os campos obrigatórios.
   */
  private parseAndValidate(raw: string): CasoJuridicoInformations {
    let parsed: GptExtractionResponse;

    try {
      // Remove eventuais blocos markdown caso o modelo ignore a instrução
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean) as GptExtractionResponse;
    } catch {
      this.logger.error(
        `Falha ao parsear JSON do GPT: ${raw.substring(0, 300)}`,
      );
      throw new Error(
        'O modelo retornou uma resposta em formato inválido. Tente novamente.',
      );
    }

    if (!parsed.fatosEstruturados || !parsed.fundamentosJuridicos) {
      throw new Error(
        'O modelo não retornou os campos obrigatórios (fatosEstruturados / fundamentosJuridicos).',
      );
    }

    return {
      fatosEstruturados: parsed.fatosEstruturados.trim(),
      fundamentosJuridicos: parsed.fundamentosJuridicos.trim(),
    };
  }
}
