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

    sections.push(
      '[PETIÇÃO INICIAL]\n' +
      this.limitTextStartAndEnd(pieces.peticao, 40000),
    );

    if (pieces.contestacao) {
      sections.push(
        '[CONTESTAÇÃO]\n' +
        this.limitTextStartAndEnd(pieces.contestacao, 20000),
      );
    }

    if (pieces.sentenca) {
      sections.push(
        '[SENTENÇA]\n' +
        this.limitTextStartAndEnd(pieces.sentenca, 35000),
      );
    }

    if (pieces.recurso) {
      sections.push(
        '[RECURSO]\n' +
        this.limitTextStartAndEnd(pieces.recurso, 50000),
      );
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
      `- Se uma peça não for fornecida, não especule sobre seu conteúdo e não mencione fases processuais ausentes.\n` +
      `- Se uma informação essencial não estiver presente nas peças fornecidas, informe isso de forma breve, sem criar hipóteses.\n\n` +

      `ORIENTAÇÃO SOBRE AS PEÇAS:\n` +
      `- As peças podem conter Petição Inicial, Contestação, Sentença e Recurso.\n` +
      `- Quando houver mais de uma peça, analise o conjunto do processo, e não apenas a Petição Inicial.\n` +
      `- No campo "pedidos", considere também pedidos da parte contrária e pedidos recursais, quando existirem.\n` +
      `- No campo "fundamentosJuridicos", considere fundamentos usados pelas partes, pela sentença e pelo recurso, quando existirem.\n` +
      `- Quando houver sentença, mencione obrigatoriamente no campo "pedidos" ou "fatos" se a segurança foi concedida, denegada, julgada procedente, improcedente ou se houve outro resultado decisório relevante.\n` +
      `- Quando houver recurso, mencione obrigatoriamente no campo "pedidos" qual parte recorreu e o que ela buscou: reforma, anulação, manutenção, integração ou esclarecimento da decisão.\n` +
      `- No campo "pedidos", não limite a resposta aos pedidos da Petição Inicial quando houver Sentença ou Recurso; inclua também o resultado da sentença e a pretensão recursal.\n` +
      `- Na análise com múltiplas peças, a resposta deve refletir necessariamente Petição Inicial, Contestação/Informações, Sentença e Recurso, quando fornecidos.\n\n` +

      `INFORMAÇÕES A EXTRAIR:\n` +
      `1. fatos: Descreva os fatos narrados no processo — o que aconteceu, quem são as partes, qual é a situação fática que originou a demanda.\n` +
      `2. pedidos: Descreva os pedidos e pretensões processuais em todas as fases fornecidas — inclua os pedidos da Petição Inicial, a pretensão defensiva da Contestação/Informações, o resultado relevante da Sentença e, quando houver Recurso, indique qual parte recorreu e se buscou reforma, anulação, manutenção, integração ou esclarecimento da decisão.\n` +
      `3. fundamentosJuridicos: Descreva os fundamentos jurídicos invocados nas peças fornecidas — inclua teses da parte autora, teses da parte contrária, fundamentos adotados ou rejeitados na Sentença e fundamentos utilizados no Recurso, quando existirem, citando leis, artigos, princípios, jurisprudências e precedentes relevantes.\n\n` +

      `IMPORTANTE SOBRE PRECISÃO JURÍDICA:\n` +
      `- Cite dispositivos legais com precisão quando eles aparecerem nas peças.\n` +
      `- Não confunda artigo, inciso e parágrafo. Por exemplo, se a peça mencionar "art. 156, § 2º, I, da Constituição Federal", mantenha essa estrutura.\n` +
      `- Não afirme que uma parte "não apresentou fundamentos" salvo se isso estiver expressamente claro no texto fornecido.\n\n` +

      `Retorne EXCLUSIVAMENTE um JSON com os seguintes campos: "fatos", "pedidos", "fundamentosJuridicos".\n\n` +
      `PEÇAS PROCESSUAIS:\n\n` +
      pecasTexto
    );
  }

  /**
   * Limita o texto de forma econômica, preservando o início e o final.
   *
   * Por que não usar apenas slice(0, maxChars)?
   * - O início costuma conter qualificação das partes, fatos e contexto.
   * - O final costuma conter pedidos, dispositivo, conclusões e requerimentos.
   * - Em peças longas, pegar só o começo pode ocultar justamente os pedidos.
   */
  private limitTextStartAndEnd(text: string, maxChars: number): string {
    const clean = this.normalizeText(text);

    if (!clean) {
      return '';
    }

    if (clean.length <= maxChars) {
      return clean;
    }

    const startSize = Math.floor(maxChars * 0.55);
    const endSize = maxChars - startSize;

    const start = clean.slice(0, startSize);
    const end = clean.slice(clean.length - endSize);

    return (
      start +
      '\n\n[... TRECHO INTERMEDIÁRIO OMITIDO PARA CABER NO CONTEXTO ...]\n\n' +
      end
    );
  }

  private normalizeText(text: string | undefined): string {
    return (text ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  private sanitize(value: string | undefined): string {
    return (value ?? '').replace(/\r\n/g, '\n').trim();
  }
}