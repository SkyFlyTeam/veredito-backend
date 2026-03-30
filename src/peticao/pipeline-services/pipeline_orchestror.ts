import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordProcessingService } from './word_processing/word-processing.service';
import { PeticaoEntity } from '../entity/peticao.entity';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { SemanticSearchService } from '../semantic-search/service/semantic-search.service';
import { PrecedenteSugeridoService } from '../../precedents/service/precedente_sugerido.service';

export interface PipelineResult {
  peticaoId: number;
  resumo: string | null;
  precedentes: any[];
}

@Injectable()
export class PipelineOrchestrator {
  private readonly logger = new Logger(PipelineOrchestrator.name);

  constructor(
    private readonly wordProcessingService: WordProcessingService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly semanticSearchService: SemanticSearchService,
    private readonly precedenteSugeridoService: PrecedenteSugeridoService,
    @InjectRepository(PeticaoEntity)
    private readonly peticaoRepository: Repository<PeticaoEntity>,
  ) { }

  async run(peticaoId: number): Promise<PipelineResult> {
    this.logger.log(`Iniciando pipeline completo para Petição ID: ${peticaoId}`);

    const peticao = await this.peticaoRepository.findOne({ where: { id: peticaoId } });
    if (!peticao) {
      throw new NotFoundException(`Petição com ID ${peticaoId} não encontrada`);
    }

    this.logger.log('Passo 1: Extraindo texto bruto do arquivo...');
    const rawText = await this.wordProcessingService.extractTextFromPath(peticao.caminhoArquivo);
    if (!rawText) {
      throw new Error('Falha ao extrair texto do arquivo da petição.');
    }

    this.logger.log('Passo 2: Gerando embeddings do texto bruto normalizado...');
    const textForEmbedding = rawText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
    const embedding = await this.embeddingsService.generateEmbedding(textForEmbedding);
    const vector = JSON.stringify(embedding);

    this.logger.log('Passo 3: Persistindo atualizações da petição (vetores)...');
    peticao.resumo = null;
    peticao.teseVetor = vector;
    peticao.questaoVetor = vector;
    await this.peticaoRepository.save(peticao);

    this.logger.log('Passo 4: Buscando precedentes similares...');
    const suggestedPrecedents = await this.semanticSearchService.searchSimilar(embedding);

    this.logger.log('Passo 5: Salvando precedentes sugeridos no banco de dados...');
    const formattedPrecedents: any[] = [];

    for (let i = 0; i < suggestedPrecedents.length; i++) {
      const match = suggestedPrecedents[i];

      await this.precedenteSugeridoService.create({
        percentual_similaridade: match.score ? Number(((1 - match.score) * 100).toFixed(2)) : 0,
        classificacao: i + 1,
        sintese_explicativa: '',
        precedente_id: match.id,
        peticao_id: peticao.id,
      });

      formattedPrecedents.push({
        id: match.id,
        numero_registro: match.numero_registro,
        tese: match.tese,
        questao: match.questao,
        score: match.score,
      });
    }

    this.logger.log(`Análise completa finalizada para Petição ID: ${peticaoId}`);

    return {
      peticaoId,
      resumo: null,
      precedentes: formattedPrecedents,
    };
  }
}
