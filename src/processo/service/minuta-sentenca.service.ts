import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
import { Document, Paragraph, TextRun, Packer, AlignmentType, HeadingLevel } from 'docx';
import ProcessoJuridicoEntity from '../entity/processo_juridico.entity';
import { MinutaSentencaDto } from '../dtos/minuta-sentenca.dto';
import { PrecedenteSugeridoEntity } from '../../precedents/entity/precedente_sugerido.entity';

export interface SecoesSentenca {
  relatorio: string;
  fundamentacao: string;
  dispositivo: string;
}

@Injectable()
export class MinutaSentencaService {
  private readonly logger = new Logger(MinutaSentencaService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(ProcessoJuridicoEntity)
    private readonly processoRepository: Repository<ProcessoJuridicoEntity>,
    @InjectRepository(PrecedenteSugeridoEntity)
    private readonly precedenteSugeridoRepository: Repository<PrecedenteSugeridoEntity>,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async gerarMinutaSentenca(dto: MinutaSentencaDto): Promise<Buffer> {
    const { dispositivo, precedentesSugeridos: precedentes_sugeridos_ids, processo_id } = dto;

    const processo = await this.processoRepository.findOne({
      where: { id: processo_id },
    });

    if (!processo) {
      throw new NotFoundException(`Processo jurídico com ID ${processo_id} não encontrado.`);
    }

    let precedentesSugeridos: PrecedenteSugeridoEntity[] = [];
    if (precedentes_sugeridos_ids && precedentes_sugeridos_ids.length > 0) {
      precedentesSugeridos = await this.precedenteSugeridoRepository.find({
        where: { id: In(precedentes_sugeridos_ids) },
        relations: ['precedente', 'precedente.especie'],
      });
    }

    // 1. Chamar LLM para gerar as seções principais da sentença
    const secoes = await this.gerarSecoesLLM(processo, dispositivo, precedentesSugeridos);

    // 2. Montar o DOCX
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({ text: 'Modelo De Sentença', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: 'Modelo de Sentença', bold: true })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: 'Processo Nº: [Nº do Processo]', bold: true })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: `Classe: ${processo.classe_processual || '[Classe]'}`, bold: true })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: 'Autor: [Nome do Autor]', bold: true })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: 'Réu: [Nome do Réu]', bold: true })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: 'Vistos, etc.', bold: true })] }),
            new Paragraph({ text: '' }),
            
            // Relatório
            new Paragraph({ children: [new TextRun({ text: 'I - RELATÓRIO', bold: true })] }),
            new Paragraph({ text: '' }),
            ...this.criarParagrafosTexto(secoes.relatorio),
            new Paragraph({ text: '' }),

            // Fundamentação
            new Paragraph({ children: [new TextRun({ text: 'II - FUNDAMENTAÇÃO', bold: true })] }),
            new Paragraph({ text: '' }),
            ...this.criarParagrafosTexto(secoes.fundamentacao),
            new Paragraph({ text: '' }),

            // Dispositivo
            new Paragraph({ children: [new TextRun({ text: 'III - DISPOSITIVO', bold: true })] }),
            new Paragraph({ text: '' }),
            ...this.criarParagrafosTexto(secoes.dispositivo),
            new Paragraph({ text: '' }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  private async gerarSecoesLLM(
    processo: ProcessoJuridicoEntity,
    dispositivoRecebido: string,
    precedentes: PrecedenteSugeridoEntity[],
  ): Promise<SecoesSentenca> {
    this.logger.log(`Gerando seções da sentença via OpenAI para o processo ${processo.id}...`);

    const fatos = processo.fatos || 'Não informado';
    const pedidos = processo.pedidos || 'Não informado';
    const fundamentos = processo.fundamentos || 'Não informado';
    const precedentesTexto = precedentes
      ?.map((p) => {
        const especieNome = p.precedente?.especie?.nome || 'Precedente';
        const numeroRegistro = p.precedente?.numero_registro || 'Sem número';
        return `${especieNome} ${numeroRegistro}:\nSíntese: ${p.sintese_explicativa}`;
      })
      .join('\n\n') || 'Nenhum precedente sugerido.';

    const prompt = `Você é um magistrado redigindo uma minuta de sentença. Sua tarefa é produzir os textos para as 3 seções principais do documento: Relatório, Fundamentação e Dispositivo.

Contexto do Processo:
- Fatos: ${fatos}
- Pedidos: ${pedidos}
- Fundamentos Jurídicos da Parte: ${fundamentos}

Precedentes Sugeridos para embasar a decisão:
${precedentesTexto}

Texto base para o Dispositivo:
${dispositivoRecebido}

Instruções para cada seção:
1. "relatorio": Faça um resumo estruturado utilizando os fatos, pedidos e fundamentos jurídicos da entidade fornecida.
2. "fundamentacao": Analise a matéria de fato e direito. Utilize os fundamentos jurídicos, pedidos e a lista de precedentes sugeridos. Encaixe os precedentes de acordo e justifique seu uso no caso concreto com base nas sínteses.
3. "dispositivo": Elabore o dispositivo com clareza a partir do "Texto base para o Dispositivo", refinando-o e adaptando-o conforme a análise feita no relatório e na fundamentação.

IMPORTANTE: Responda APENAS com um objeto JSON válido, contendo as chaves: "relatorio", "fundamentacao" e "dispositivo". O valor de cada chave deve ser o texto formatado (pode usar quebras de linha \\n) correspondente àquela seção. Não inclua os títulos das seções (ex: "I - RELATÓRIO") no texto retornado, pois eles serão inseridos pelo sistema.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente jurídico experiente que redige sentenças judiciais. Retorne apenas JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      return {
        relatorio: result.relatorio || 'Relatório não gerado.',
        fundamentacao: result.fundamentacao || 'Fundamentação não gerada.',
        dispositivo: result.dispositivo || 'Dispositivo não gerado.',
      };
    } catch (error) {
      this.logger.error('Erro ao gerar sentença com OpenAI', error.stack);
      return {
        relatorio: 'Erro ao gerar texto do relatório com a LLM.',
        fundamentacao: 'Erro ao gerar texto da fundamentação com a LLM.',
        dispositivo: 'Erro ao gerar texto do dispositivo com a LLM.',
      };
    }
  }

  private criarParagrafosTexto(texto: string): Paragraph[] {
    if (!texto) return [];
    const linhas = texto.split('\n').filter((l) => l.trim().length > 0);
    return linhas.map(
      (linha) =>
        new Paragraph({
          children: [new TextRun(linha)],
        }),
    );
  }
}
