import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordProcessingService } from './word_processing/word-processing.service';
import { PeticaoEntity } from '../entity/peticao.entity';
import { TextProcessingService } from './word_processing/text-processing.service';
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
    private readonly textProcessingService: TextProcessingService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly semanticSearchService: SemanticSearchService,
    private readonly precedenteSugeridoService: PrecedenteSugeridoService,
    // private readonly summaryService: SummaryService,
    @InjectRepository(PeticaoEntity)
    private readonly peticaoRepository: Repository<PeticaoEntity>,
  ) { }

  async run(peticaoId: number): Promise<PipelineResult> {
    this.logger.log(`Iniciando pipeline completo para Petição ID: ${peticaoId}`);

    const peticao = await this.peticaoRepository.findOne({ where: { id: peticaoId } });
    if (!peticao) {
      throw new NotFoundException(`Petição com ID ${peticaoId} não encontrada`);
    }

    let rawText: string;
    try {
      this.logger.log('Passo 1: Extraindo texto bruto do arquivo...');
      rawText = await this.wordProcessingService.extractTextFromPath(peticao.caminhoArquivo);
      if (!rawText) throw new Error('Falha ao extrair texto do arquivo da petição.');
    } catch (error) {
      this.logger.error(`[PASSO 1 - Extração] falhou para Petição ID ${peticaoId}: ${error.message}`);
      throw error;
    }

    let processedText: string;
    try {
      this.logger.log('Passo 2: Processamento NLP...');
      processedText = this.textProcessingService.process(rawText);
    } catch (error) {
      this.logger.error(`[PASSO 2 - NLP] falhou para Petição ID ${peticaoId}: ${error.message}`);
      throw error;
    }

    let embedding: number[];
    try {
      this.logger.log('Passo 3: Gerando embeddings do texto...');
      const textForEmbedding = processedText
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000);
      embedding = await this.embeddingsService.generateEmbedding(textForEmbedding);
    } catch (error) {
      this.logger.error(`[PASSO 3 - Vetorização] falhou para Petição ID ${peticaoId}: ${error.message}`);
      throw error;
    }

    try {
      this.logger.log('Passo 4: Persistindo atualizações da petição (vetores)...');
      peticao.resumo = null;
      peticao.teseVetor = embedding;
      peticao.questaoVetor = embedding;
      await this.peticaoRepository.save(peticao);
    } catch (error) {
      this.logger.error(`[PASSO 4 - Persistência Petição] falhou para Petição ID ${peticaoId}: ${error.message}`);
      throw error;
    }

    let suggestedPrecedents: any[];
    try {
      this.logger.log('Passo 6: Buscando precedentes similares...');
      suggestedPrecedents = await this.semanticSearchService.searchSimilar(embedding);
    } catch (error) {
      this.logger.error(`[PASSO 5 - Busca Semântica] falhou para Petição ID ${peticaoId}: ${error.message}`);
      throw error;
    }

    try {
      this.logger.log('Passo 6: Salvando precedentes sugeridos em lote...');
      const dtos = suggestedPrecedents.map((match, index) => ({
        percentual_similaridade: match.score
          ? Number((((match.score + 1) / 2) * 100).toFixed(2))
          : 0,
        classificacao: index + 1,
        sintese_explicativa: '',
        precedente_id: match.id,
        peticao_id: peticao.id,
      }));

      await this.precedenteSugeridoService.createBulk(dtos);
    } catch (error) {
      this.logger.error(`[PASSO 6 - Persistência Sugestões] falhou para Petição ID ${peticaoId}: ${error.message}`);
      throw error;
    }

    this.logger.log(`Análise completa finalizada para Petição ID: ${peticaoId}`);

    return {
      peticaoId,
      resumo: null,
      precedentes: [],
    };
  }
}
