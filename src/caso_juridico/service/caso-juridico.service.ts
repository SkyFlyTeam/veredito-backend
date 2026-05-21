import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CasoJuridicoEntity } from '../entity/caso_juridico.entity';
import { SecoesPeticaoEntity } from '../entity/secoes_peticao.entity';

@Injectable()
export class CasoJuridicoService {
  private readonly logger = new Logger(CasoJuridicoService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(CasoJuridicoEntity)
    private readonly casoRepository: Repository<CasoJuridicoEntity>,
    @InjectRepository(SecoesPeticaoEntity)
    private readonly secoesPeticaoRepository: Repository<SecoesPeticaoEntity>,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async gerarPeticaoInicial(
    casoId: number,
  ): Promise<SecoesPeticaoEntity> {
    this.logger.log(`Iniciando geração de petição inicial para o Caso Jurídico ID: ${casoId}`);

    const caso = await this.casoRepository.findOne({
      where: { id: casoId },
      relations: ['secoesPeticao'],
    });

    if (!caso) {
      throw new NotFoundException(`Caso Jurídico com ID ${casoId} não encontrado`);
    }

    const prompt = this.construirPrompt(caso);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente jurídico brasileiro altamente técnico. Responda apenas no formato JSON contendo as chaves "titulo" (uma string curta, por exemplo "Seções da Petição Inicial") e "conteudo" (o texto contendo apenas as seções "DOS FATOS" e "DOS PEDIDOS" em formato markdown ou texto corrido estruturado).',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const jsonResponse = JSON.parse(response.choices[0]?.message?.content || '{}');
      const titulo = jsonResponse.titulo || 'Petição Inicial';
      const conteudo = jsonResponse.conteudo;

      if (!conteudo) {
        throw new Error('A resposta da OpenAI não conteve a seção de conteúdo da petição.');
      }

      // Salva a nova entidade secoes_peticao
      const novaSecao = this.secoesPeticaoRepository.create({
        titulo,
        conteudo,
      });
      const secaoSalva = await this.secoesPeticaoRepository.save(novaSecao);

      // Associa a seção de petição ao caso jurídico correspondente
      caso.secoesPeticao = secaoSalva;
      await this.casoRepository.save(caso);

      this.logger.log(`Petição inicial gerada e salva com sucesso para o Caso Jurídico ID: ${casoId}`);
      return secaoSalva;
    } catch (error) {
      this.logger.error(`Falha ao gerar petição inicial para o Caso Jurídico ID ${casoId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private construirPrompt(caso: CasoJuridicoEntity): string {
    let prompt = `Você deve redigir APENAS as seções "DOS FATOS" e "DOS PEDIDOS" para uma petição inicial com base no seguinte caso jurídico brasileiro.
ATENÇÃO: Não inclua endereçamento, qualificação das partes, introdução, fatos/direito misturados em outras seções, nem encerramento. Gere única e exclusivamente as duas seções solicitadas: "DOS FATOS" e "DOS PEDIDOS".

Informações do caso:
- Área do Direito: ${caso.area_direito}
- Pedidos Principais: ${caso.pedidos_principais}
- Tese Pretendida: ${caso.tese_pretendida}
- UF correspondente: ${caso.uf}
${caso.fundamentos_juridicos ? `- Fundamentos Jurídicos: ${caso.fundamentos_juridicos}` : ''}
${caso.fatos_estruturados ? `- Fatos Estruturados do Caso: ${caso.fatos_estruturados}` : ''}

Diretrizes para a geração:
1. Seção "DOS FATOS": Elabore e detalhe o ocorrido de forma técnica e objetiva com base nos fatos fornecidos.
2. Seção "DOS PEDIDOS": Liste de forma concisa e técnica todas as pretensões (citação, procedência dos pedidos principais, condenações de sucumbência, produção de provas, e valor da causa com placeholder).
3. Não crie cabeçalho ou rodapé. Limite-se estritamente às duas seções.
`;

    prompt += `
Abaixo estão fornecidos trechos de exemplos das seções "DOS FATOS" e "DOS PEDIDOS" de petições reais para guiar o estilo, a linguagem jurídica rebuscada e o padrão de escrita técnica. Siga este padrão de escrita ao redigir as seções:

--- EXEMPLO 1 ---
DOS FATOS:
O(a) autor(a) encontra-se regularmente matriculado(a) no curso de [nome do curso], oferecido pela universidade ré, conforme comprovam os documentos anexos (ID [●]).
Desde seu ingresso na instituição, a universidade tem exigido, para a efetivação da matrícula em cada período letivo, o pagamento de uma taxa denominada “taxa de matrícula” ou “contribuição de serviços acadêmicos”, cujo recolhimento é imposto como condição para o exercício regular do direito à educação, inclusive com bloqueio de matrícula em caso de inadimplemento.
No presente semestre, por exemplo, foi cobrado o valor de R$ [●] (comprovante ID [●]), sem qualquer contraprestação específica que justificasse tal exigência, sendo o valor vinculado apenas ao ato administrativo de matrícula acadêmica, procedimento inerente ao funcionamento regular da instituição pública de ensino.
Tal cobrança tem se repetido de forma sistemática desde o ingresso do(a) autor(a) na universidade, sob a ameaça de cancelamento da matrícula em caso de não pagamento, conforme se comprova pelos documentos de ID [●] e comunicações eletrônicas anexas.

DOS PEDIDOS:
Ante o exposto, requer-se a Vossa Excelência:
1. A concessão de tutela provisória de urgência, para determinar que a ré se abstenha de exigir o pagamento de qualquer valor a título de “taxa de matrícula” ou similar como condição para a realização de matrícula nos próximos períodos letivos, sob pena de multa diária;
2. A citação da ré para, querendo, apresentar resposta no prazo legal;
3. Ao final, seja julgada PROCEDENTE a presente ação para:
a. Declarar a nulidade da cobrança de taxa de matrícula ou qualquer outra denominação equivalente, por ausência de amparo legal e afronta à Constituição;
b. Condenar a ré à repetição do indébito, no valor total de R$ [●], correspondente às quantias indevidamente pagas nos semestres [●], atualizadas monetariamente desde cada desembolso e acrescidas de juros legais desde a citação;
c. Confirmar a obrigação de não fazer, consistente na vedação à ré de exigir qualquer valor como condição para efetivação de matrícula em curso de graduação pública.
4. A condenação da ré ao pagamento das custas processuais e honorários advocatícios, na forma do artigo 85 do CPC.
Protesta provar o alegado por todos os meios admitidos em direito, especialmente prova documental e pericial contábil, se necessário.
Dá-se à causa o valor de R$ [●].
`;

    return prompt;
  }
}
