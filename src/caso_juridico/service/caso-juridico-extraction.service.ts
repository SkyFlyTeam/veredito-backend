import {
  BadRequestException,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { WordProcessingService } from '../../peticao/pipeline-services/word_processing/word-processing.service';
import { CasoJuridicoInformations } from '../dto/caso-juridico-informations.dto';

interface GptExtractionResponse {
  fatosEstruturados: string;
  fundamentosJuridicos: string;
}

@Injectable()
export class CasoJuridicoExtractionService {
  private readonly logger = new Logger(CasoJuridicoExtractionService.name);
  private readonly openai: OpenAI;

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

  async extractFromDocuments(files: any[]): Promise<CasoJuridicoInformations> {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Nenhum arquivo enviado. Envie ao menos um documento jurídico.',
      );
    }

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

        textsWithSource.push(
          `=== DOCUMENTO: ${file.originalname} ===\n${text.trim()}`,
        );
        this.logger.log(
          `Texto extraído de "${file.originalname}" (${text.length} caracteres).`,
        );
      } catch (err) {
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

    const MAX_CORPUS_CHARS = 80_000;
    const corpus = textsWithSource.join('\n\n').substring(0, MAX_CORPUS_CHARS);

    this.logger.log(
      `Corpus montado com ${textsWithSource.length} documento(s) — ${corpus.length} caracteres.`,
    );

    return this.callGpt(corpus);
  }

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
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const rawContent: string = response.choices[0]?.message?.content ?? '';
    this.logger.log(`Extração concluída com sucesso.`);
    return this.parseAndValidate(rawContent);
  }

  private parseAndValidate(raw: string): CasoJuridicoInformations {
    let parsed: GptExtractionResponse;

    try {
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