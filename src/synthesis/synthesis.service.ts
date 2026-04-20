import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

export interface SynthesisResponse {
  sintese: string;
  classificacao: number; // ENUM (0: Não Aplicável, 1: Possivelmente Aplicável, 2: Aplicável)
}

@Injectable()
export class SynthesisService {
  private readonly logger = new Logger(SynthesisService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateSynthesis(peticao: string, precedente: string): Promise<SynthesisResponse> {
    try {
      this.logger.log('Generating legal synthesis and classification using GPT-4o-mini...');

      const prompt = `Você é um assistente jurídico especializado em análise de precedentes. 
Sua tarefa é gerar uma síntese explicativa da correlação jurídica entre uma petição e um precedente sugerido, e classificar a aplicabilidade desse precedente.

Regras de Geração da Síntese:
1. Máximo de 4 linhas.
2. Texto em parágrafo único.
3. Linguagem jurídica, objetiva e técnica.
4. Foco exclusivo na correlação entre petição e precedente.
5. Deve indicar a similaridade fática e/ou jurídica, a aplicabilidade do precedente ao caso concreto e a relação entre a tese do precedente e o pedido da petição.
6. Proibido listas, comentários extras, opiniões pessoais ou explicações fora da correlação jurídica.

Regras de Classificação:
Selecione EXATAMENTE uma das opções abaixo:
- "Aplicável": Se o precedente guarda estrita relação fática e jurídica com o caso, sendo diretamente utilizável.
- "Possivelmente aplicável": Se há similaridade em alguns pontos, mas pode exigir distinção ou análise mais profunda.
- "Não aplicável": Se a matéria tratada no precedente é distinta ou se os fatos são substancialmente diferentes.

IMPORTANTE: Se o precedente for claramente relacionado ao tema central da petição, prefira "Aplicável".

A saída deve ser um JSON estruturado com os campos "sintese" e "classificacao" (string).

Entrada:
Petição: ${peticao.substring(0, 6000)}
Precedente: ${precedente.substring(0, 4000)}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente jurídico altamente técnico. Responda apenas em formato JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      return {
        sintese: (result.sintese || '').replace(/\n+/g, ' ').substring(0, 500),
        classificacao: this.mapClassificacaoToEnum(result.classificacao),
      };
    } catch (error) {
      this.logger.error('Error generating synthesis and classification with OpenAI', error.stack);
      return {
        sintese: 'Não foi possível gerar a síntese explicativa no momento.',
        classificacao: 0,
      };
    }
  }

  private mapClassificacaoToEnum(value: string): number {
    const lowerValue = value?.toLowerCase() || '';

    if (lowerValue.includes('aplicável') && !lowerValue.includes('não') && !lowerValue.includes('possivelmente')) {
      return 2;
    }
    if (lowerValue.includes('possivelmente')) {
      return 1;
    }
    if (lowerValue.includes('não')) {
      return 0;
    }

    return 0;
  }
}
