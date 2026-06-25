import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CasoJuridicoEntity } from '../entity/caso_juridico.entity';
import { SecoesPeticaoEntity } from '../entity/secoes_peticao.entity';
import { CasoPrecedenteSugeridoEntity } from '../entity/caso_precedente_sugerido.entity';
import { UpdateSecaoPeticaoDto } from '../dto/update-secao-peticao.dto';

@Injectable()
export class CasoJuridicoService {
  private readonly logger = new Logger(CasoJuridicoService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(CasoJuridicoEntity)
    private readonly casoRepository: Repository<CasoJuridicoEntity>,
    @InjectRepository(SecoesPeticaoEntity)
    private readonly secoesPeticaoRepository: Repository<SecoesPeticaoEntity>,
    @InjectRepository(CasoPrecedenteSugeridoEntity)
    private readonly casoPrecedenteSugeridoRepository: Repository<CasoPrecedenteSugeridoEntity>,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async gerarPeticaoInicial(
    casoId: number,
  ): Promise<SecoesPeticaoEntity[]> {
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
            content: 'Você é um assistente jurídico brasileiro altamente técnico. Responda apenas no formato JSON contendo uma lista de seções na chave "secoes", onde cada seção possui as chaves "titulo" (o título da seção, ex: "DOS FATOS", "DA TUTELA ANTECIPADA", etc.) e "conteudo" (o corpo daquela seção). Não inclua cabeçalho, rodapé ou introdução. Não utilize numeração (romana ou cardinal) nos títulos das seções (escreva apenas "DOS FATOS", "DOS PEDIDOS", etc., sem prefixos como "I – " ou "1 – "). As seções obrigatórias são apenas as de fatos e pedidos. As seções intermediárias de direito são opcionais e devem ser criadas de forma dinâmica e com títulos específicos baseados no caso (evitando o título genérico "DO DIREITO"), ou omitidas se não houver fundamentação que as justifique.',
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
      const secoesJson = jsonResponse.secoes;

      if (!secoesJson || !Array.isArray(secoesJson) || secoesJson.length === 0) {
        throw new Error('A resposta da OpenAI não conteve a lista de seções da petição.');
      }

      // Remove as seções antigas associadas a este caso
      await this.secoesPeticaoRepository.delete({ casoJuridicoId: casoId });

      // Salva as novas entidades secoes_peticao
      const novasSecoes = secoesJson.map((s) => {
        return this.secoesPeticaoRepository.create({
          titulo: s.titulo || 'Seção',
          conteudo: s.conteudo || '',
          casoJuridicoId: casoId,
        });
      });
      const secoesSalvas = await this.secoesPeticaoRepository.save(novasSecoes);

      this.logger.log(`Petição inicial gerada e salva com sucesso para o Caso Jurídico ID: ${casoId}`);
      return secoesSalvas;
    } catch (error) {
      this.logger.error(`Falha ao gerar petição inicial para o Caso Jurídico ID ${casoId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async obterSecoesPeticao(casoId: number): Promise<{ caso: CasoJuridicoEntity; secoes: SecoesPeticaoEntity[] }> {
    const caso = await this.casoRepository.findOne({
      where: { id: casoId },
    });

    if (!caso) {
      throw new NotFoundException(`Caso Jurídico com ID ${casoId} não encontrado`);
    }

    const secoes = await this.secoesPeticaoRepository.find({
      where: { casoJuridicoId: casoId },
    });

    return { caso, secoes };
  }

  async getMockedResponseForCasoJuridico(): Promise<CasoJuridicoEntity> {
    const mockedCasoJuridicoId = Number(process.env.MOCKED_CASO_JURIDICO_ID);

    if (!Number.isInteger(mockedCasoJuridicoId) || mockedCasoJuridicoId <= 0) {
      throw new BadRequestException(
        'MOCKED_CASO_JURIDICO_ID deve conter o ID válido de um caso jurídico já analisado',
      );
    }

    const caso = await this.casoRepository.findOne({
      where: { id: mockedCasoJuridicoId },
    });

    if (!caso) {
      throw new NotFoundException(
        `Caso Jurídico de mock com ID ${mockedCasoJuridicoId} não encontrado`,
      );
    }

    return caso;
  }

  async findCasoJuridicoAnalysisOrFail(casoId: number): Promise<{
    caso: CasoJuridicoEntity;
    secoes: SecoesPeticaoEntity[];
    precedentesSugeridos: CasoPrecedenteSugeridoEntity[];
  }> {
    const { caso, secoes } = await this.obterSecoesPeticao(casoId);
    const precedentesSugeridos =
      await this.casoPrecedenteSugeridoRepository.find({
        where: { casoJuridicoId: casoId },
        relations: [
          'precedente',
          'precedente.status',
          'precedente.tribunal',
          'precedente.especie',
        ],
        order: { id: 'ASC' },
      });

    return { caso, secoes, precedentesSugeridos };
  }

  async updateSecaoPeticao(
    casoId: number,
    secaoId: number,
    dto: UpdateSecaoPeticaoDto,
  ): Promise<SecoesPeticaoEntity> {
    if (!dto?.conteudo || dto.conteudo.trim() === '') {
      throw new BadRequestException(
        'O campo "conteudo" e obrigatorio e nao pode ser vazio.',
      );
    }

    const secao = await this.secoesPeticaoRepository.findOne({
      where: { id: secaoId, casoJuridicoId: casoId },
    });

    if (!secao) {
      throw new NotFoundException(
        `Secao de peticao ${secaoId} nao encontrada para o caso ${casoId}.`,
      );
    }

    secao.conteudo = dto.conteudo;
    return this.secoesPeticaoRepository.save(secao);
  }

  private construirPrompt(caso: CasoJuridicoEntity): string {
    let prompt = `Você deve redigir as seções de uma petição inicial com base no caso jurídico fornecido.
As únicas seções obrigatórias são "DOS FATOS" e "DOS PEDIDOS". 
As demais seções (como fundamentações de direito específicas, tutelas de urgência, etc.) são OPCIONAIS e devem ser geradas de forma dinâmica, com títulos específicos e focados na tese do caso (por exemplo, "DA TUTELA DE URGÊNCIA", "DO DANO MORAL", "DA RESCISÃO INDIRETA"). 
EVITE usar o título genérico "DO DIREITO". Se o caso for muito simples e não exigir teses estruturadas adicionais, gere apenas as duas seções obrigatórias.

ATENÇÃO: Não utilize numeração romana ou ordinária nos títulos das seções (por exemplo: escreva apenas 'DOS FATOS', 'DOS PEDIDOS', 'DO DANO MORAL', sem prefixos como 'I – ', '1. ', etc.).
ATENÇÃO: Não gere cabeçalho (como endereçamento ao juiz, qualificação das partes, qualificação do autor/réu, título da ação) nem rodapé/encerramento (como "Termos em que pede deferimento", assinatura, data, local, etc.). Limite-se estritamente a gerar as seções estruturadas da petição.

Informações do caso:
- Área do Direito: ${caso.area_direito}
- Pedidos Principais: ${caso.pedidos_principais}
- Tese Pretendida: ${caso.tese_pretendida}
- UF correspondente: ${caso.uf}
${caso.fundamentos_juridicos ? `- Fundamentos Jurídicos: ${caso.fundamentos_juridicos}` : ''}
${caso.fatos_estruturados ? `- Fatos Estruturados do Caso: ${caso.fatos_estruturados}` : ''}

Diretrizes para a geração:
1. Seção "DOS FATOS": Elabore e detalhe o ocorrido de forma técnica e objetiva com base nos fatos fornecidos.
2. Seções Intermediárias de Direito (OPCIONAIS): Crie seções específicas para cada tese de direito relevante (ex: "DO DANO MORAL", "DA TUTELA ANTECIPADA", "DA INVERSÃO DO ÔNUS DA PROVA"). Não agrupe tudo sob um título genérico "DO DIREITO" e não force a criação dessas seções se o caso não exigir.
3. Seção "DOS PEDIDOS": Liste de forma concisa e técnica todas as pretensões (citação, procedência dos pedidos principais, condenações de sucumbência, produção de provas, e valor da causa com placeholder).
`;

    prompt += `
Abaixo estão exemplos para guiar a estrutura dinâmica das seções (cabeçalhos e rodapés foram removidos nos exemplos e NÃO devem ser gerados):

--- EXEMPLO 1 (Caso com tutela de urgência e direito específico) ---
[SEÇÕES GERADAS NO JSON]
DOS FATOS
O(a) autor(a) é estudante regularmente matriculado no curso... [conteúdo dos fatos]

DA TUTELA DE URGÊNCIA ANTECIPADA
Nos termos do artigo 300 do CPC, a concessão de tutela de urgência exige... [fundamentação da urgência]

DO DIREITO À GRATUIDADE DO ENSINO SUPERIOR PÚBLICO
Nos termos do artigo 206, inciso IV, da Constituição... [fundamentação do direito à gratuidade]

DOS PEDIDOS
Ante o exposto, requer-se: 1. A concessão da tutela provisória... 2. A citação da ré... 3. A procedência...

--- EXEMPLO 2 (Caso simples, gerando apenas Fatos e Pedidos) ---
[SEÇÕES GERADAS NO JSON]
DOS FATOS
O autor adquiriu um produto eletrônico junto ao site da ré... [conteúdo dos fatos simples]

DOS PEDIDOS
Ante o exposto, requer-se: 1. A citação da ré... 2. A condenação à entrega do produto...
`;

    return prompt;
  }
}
