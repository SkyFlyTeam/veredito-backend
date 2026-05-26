import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { ProcessPieces } from '../types/process-pieces.type';
import { ProcessInformation } from '../types/process-information.type';

@Injectable()
export class ProcessInformationService {
  private readonly logger = new Logger(ProcessInformationService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async extractInformation(pieces: ProcessPieces): Promise<ProcessInformation> {
    try {
      this.logger.log('Extraindo informações processuais via GPT-4o-mini...');

      const prompt = this.buildPrompt(pieces);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente jurídico especializado em análise de processos. ' +
              'Responda sempre em português brasileiro, de forma objetiva e técnica, ' +
              'utilizando linguagem jurídica apropriada. ' +
              'Responda SOMENTE em formato JSON conforme solicitado.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content ?? '{}';
      const result = JSON.parse(content) as Record<string, string>;

      this.logger.log('Informações processuais extraídas com sucesso.');

      return {
        fatos: this.sanitize(result.fatos),
        pedidos: this.sanitize(result.pedidos),
        fundamentosJuridicos: this.sanitize(result.fundamentosJuridicos),
      };
    } catch (error) {
      this.logger.error(
        'Erro ao extrair informações processuais via OpenAI',
        error instanceof Error ? error.stack : String(error),
      );

      return {
        fatos: 'Não foi possível extrair os fatos processuais no momento.',
        pedidos: 'Não foi possível extrair os pedidos processuais no momento.',
        fundamentosJuridicos:
          'Não foi possível extrair os fundamentos jurídicos no momento.',
      };
    }
  }

  private buildPrompt(pieces: ProcessPieces): string {
    const sections: string[] = [];

    sections.push('[PETIÇÃO INICIAL]\n' + pieces.peticao.slice(0, 8000));

    if (pieces.constentacao) {
      sections.push('[CONTESTAÇÃO]\n' + pieces.constentacao.slice(0, 6000));
    }

    if (pieces.sentenca) {
      sections.push('[SENTENÇA]\n' + pieces.sentenca.slice(0, 6000));
    }

    if (pieces.recurso) {
      sections.push('[RECURSO]\n' + pieces.recurso.slice(0, 4000));
    }

    const pecasTexto = sections.join('\n\n---\n\n');

    return (
      `Analise as peças processuais abaixo e extraia três informações essenciais do processo.\n\n` +
      `REGRAS OBRIGATÓRIAS DE FORMATO:\n` +
      `- Cada campo deve ter NO MÍNIMO 1 parágrafo e NO MÁXIMO 5 parágrafos.\n` +
      `- Cada parágrafo deve ser escrito em texto corrido e fluido, como em um documento jurídico formal — NÃO quebre em uma frase por linha.\n` +
      `- Cada parágrafo deve ter entre 80 e 150 palavras (aproximadamente 5 linhas de texto corrido).\n` +
      `- Separe os parágrafos entre si com uma linha em branco (\\n\\n).\n` +
      `- Seja objetivo, técnico e fiel ao conteúdo das peças. Não invente informações.\n` +
      `- Se uma informação não estiver presente nas peças, escreva ao menos um parágrafo completo explicando isso.\n\n` +
      `INFORMAÇÕES A EXTRAIR:\n` +
      `1. fatos: Descreva os fatos narrados no processo — o que aconteceu, quem são as partes, qual é a situação fática que originou a demanda.\n` +
      `2. pedidos: Descreva os pedidos formulados pelas partes — o que está sendo requerido ao juízo, incluindo pedidos principais e subsidiários.\n` +
      `3. fundamentosJuridicos: Descreva os fundamentos jurídicos invocados — leis, artigos, princípios, jurisprudências e teses jurídicas utilizadas pelas partes.\n\n` +
      `Retorne EXCLUSIVAMENTE um JSON com os seguintes campos: "fatos", "pedidos", "fundamentosJuridicos".\n\n` +
      `PEÇAS PROCESSUAIS:\n\n` +
      pecasTexto
    );
  }

  private sanitize(value: string | undefined): string {
    return (value ?? '').replace(/\r\n/g, '\n').trim();
  }
}
