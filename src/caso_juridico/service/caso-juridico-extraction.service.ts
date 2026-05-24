import {
  BadRequestException,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { CasoJuridicoInformations } from '../dto/caso-juridico-informations.dto';

interface GptExtractionResponse {
  fatosEstruturados: string;
  fundamentosJuridicos: string;
}


@Injectable()
export class CasoJuridicoExtractionService {
  private readonly logger = new Logger(CasoJuridicoExtractionService.name);
  private readonly openai: OpenAI;

  private readonly MIN_PARAGRAPHS = 2;
  private readonly MAX_PARAGRAPHS = 5;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async extractFromDocuments(files: any[], contexto_fatico_fundamentos: string): Promise<CasoJuridicoInformations> {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Nenhum arquivo enviado. Envie ao menos um documento jurídico.',
      );
    }

    const fileInputs = [] as Array<{ type: 'input_file'; file_id: string }>;
    const fileIds: string[] = [];

    for (const file of files) {
      try {
        if (!file?.buffer) {
          this.logger.warn(
            `Arquivo "${file?.originalname ?? 'desconhecido'}" ignorado: buffer ausente.`,
          );
          continue;
        }

        const uploaded = await this.openai.files.create({
          file: await toFile(file.buffer, file.originalname, {
            type: file.mimetype,
          }),
          purpose: 'user_data',
        });

        fileInputs.push({
          type: 'input_file',
          file_id: uploaded.id,
        });
        fileIds.push(uploaded.id);

        this.logger.log(`Arquivo "${file.originalname}" enviado ao OpenAI.`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Arquivo "${file.originalname}" ignorado: ${message}`);
      }
    }

    if (fileInputs.length === 0) {
      throw new UnsupportedMediaTypeException(
        'Nenhum dos arquivos enviados pôde ser processado. ' +
          'Certifique-se de enviar documentos jurídicos válidos nos formatos PDF, DOCX ou TXT.',
      );
    }

    this.logger.log(
      `Arquivos prontos para envio: ${fileInputs.length} documento(s).`,
    );

    return this.callGpt(fileInputs, fileIds, contexto_fatico_fundamentos);
  }

  private async callGpt(
    fileInputs: Array<{ type: 'input_file'; file_id: string }>,
    fileIds: string[],
    contexto_fatico_fundamentos: string,
  ): Promise<CasoJuridicoInformations> {
    const systemPrompt = `Você é um assistente jurídico especializado em análise documental. O caso em questão envolve os seguinte contexto fático e fundamentos jurídicos: ${contexto_fatico_fundamentos}.
Sua tarefa é analisar documentos jurídicos apresentados e usa-los para complementar o contexto apresentado, gerando no final duas seções obrigatórias:

1. **fatosEstruturados** — Narrativa objetiva e cronológica dos fatos relevantes ao caso.
   Descreva quem são as partes, o que aconteceu, quando e quais circunstâncias são juridicamente relevantes.
   Baseie-se estritamente fatos apresentados nos documentos e no contexto. Não invente fatos.

2. **fundamentosJuridicos** — Fundamentos legais aplicáveis: artigos de lei, princípios constitucionais,
   súmulas, jurisprudência ou doutrina mencionados ou claramente inferíveis dos documentos e no contexto apresentado.
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

    const userPrompt =
      'Analise os documentos anexados e extraia os fatos estruturados e fundamentos juridicos conforme as instrucoes.';

    this.logger.log('Enviando arquivos ao GPT-4o para extração jurídica...');

    try {
      const response = await this.openai.responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }, ...fileInputs],
          },
        ],
        temperature: 0.2,
        max_output_tokens: 2048,
        text: {
          format: { type: 'json_object' },
        },
      });

      const rawContent: string = response.output_text ?? '';
      this.logger.log('Extração concluída com sucesso.');
      return this.parseAndValidate(rawContent);
    } finally {
      await this.cleanupFiles(fileIds);
    }
  }

  private async cleanupFiles(fileIds: string[]): Promise<void> {
    if (fileIds.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      fileIds.map((fileId) => this.openai.files.del(fileId)),
    );

    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      this.logger.warn(
        `Falha ao remover ${failures.length} arquivo(s) do OpenAI após a extração.`,
      );
      return;
    }

    this.logger.log(
      `Arquivos temporarios removidos do OpenAI: ${fileIds.length} arquivo(s).`,
    );
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