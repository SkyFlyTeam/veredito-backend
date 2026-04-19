/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface PeticaoSummary {
  teseJuridica: string;
  solicitacaoPedido: string;
}

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generates a structured summary of a legal petition (petição) using GPT-4o-mini.
   * The summary highlights the legal thesis and the request/claim of the petition.
   *
   * @param rawText - Raw text extracted from the petition file
   * @returns PeticaoSummary containing teseJuridica and solicitacaoPedido
   */
  async summarize(rawText: string): Promise<PeticaoSummary> {
    this.logger.log(
      `Gerando resumo para texto de ${rawText.length} caracteres...`,
    );

    const prompt = this.buildPrompt(rawText);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente jurídico especializado em análise de petições. ' +
            'Responda sempre em português brasileiro, de forma objetiva e técnica. ' +
            'Respeite rigorosamente os limites de linhas indicados no prompt.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content ?? '';
    return this.parseResponse(content);
  }

  private buildPrompt(rawText: string): string {
    return (
      `Analise a petição jurídica abaixo e produza um resumo estruturado com exatamente duas seções.\n\n` +
      `REGRAS OBRIGATÓRIAS:\n` +
      `- TESE JURÍDICA: exatamente 1 parágrafo, MÁXIMO 5 linhas. Descreva os fundamentos jurídicos e argumentos principais. Seja conciso. NÃO ultrapasse 5 linhas.\n` +
      `- SOLICITAÇÃO/PEDIDO: exatamente 1 parágrafo, MÁXIMO 3 linhas. Descreva o que está sendo solicitado ao juízo. Seja conciso. NÃO ultrapasse 3 linhas.\n` +
      `- Não inclua nenhum texto fora das duas seções.\n\n` +
      `Responda SOMENTE no seguinte formato:\n` +
      `TESE JURÍDICA:\n<texto com no máximo 5 linhas>\n\nSOLICITAÇÃO/PEDIDO:\n<texto com no máximo 3 linhas>\n\n` +
      `Texto da petição:\n"""\n${rawText.slice(0, 12000)}\n"""`
    );
  }

  private parseResponse(content: string): PeticaoSummary {
    const teseMatch = content.match(
      /TESE JUR[IÍ]DICA:\s*([\s\S]*?)(?=SOLICITA[ÇC][ÃA]O\/PEDIDO:|$)/i,
    );
    const pedidoMatch = content.match(
      /SOLICITA[ÇC][ÃA]O\/PEDIDO:\s*([\s\S]*?)$/i,
    );

    const teseJuridica = this.truncateLines(
      teseMatch?.[1]?.trim() ?? content.trim(),
      5,
    );
    const solicitacaoPedido = this.truncateLines(
      pedidoMatch?.[1]?.trim() ?? '',
      3,
    );

    return { teseJuridica, solicitacaoPedido };
  }

  private truncateLines(text: string, maxLines: number): string {
    return text
      .split('\n')
      .slice(0, maxLines)
      .join('\n')
      .trim();
  }
}
