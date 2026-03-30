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
    @InjectRepository(PeticaoEntity)
    private readonly peticaoRepository: Repository<PeticaoEntity>,
  ) { }

  async run(peticaoId: number): Promise<PipelineResult> {
    this.logger.log(`Starting full pipeline for Petição ID: ${peticaoId}`);

    const peticao = await this.peticaoRepository.findOne({ where: { id: peticaoId } });
    if (!peticao) {
      throw new NotFoundException(`Petição com ID ${peticaoId} não encontrada`);
    }

    // 1. EXTRACTION
    this.logger.log('Step 1: Extracting raw text from file...');
    const rawText = await this.wordProcessingService.extractTextFromPath(peticao.caminhoArquivo);
    if (!rawText) {
      throw new Error('Falha ao extrair texto do arquivo da petição.');
    }

    // 2. NLP PROCESSING
    this.logger.log('Step 2: Applied NLP processing...');
    const processedText = this.textProcessingService.process(rawText);

    // 3. VECTORIZATION
    this.logger.log('Step 3: Generating embeddings from entire processed text...');
    const textForEmbedding = processedText;
    const embedding = await this.embeddingsService.generateEmbedding(textForEmbedding);
    const vector = JSON.stringify(embedding);

    // 4. PERSIST PETICAO
    this.logger.log('Step 4: Persisting petition updates (vectors)...');
    peticao.resumo = null;
    peticao.teseVetor = vector;
    peticao.questaoVetor = vector;
    await this.peticaoRepository.save(peticao);

    // 5. SEMANTIC SEARCH
    this.logger.log('Step 5: Searching for similar precedents...');
    const suggestedPrecedents = await this.semanticSearchService.searchSimilar(embedding);

    // 6. PERSIST SUGGESTIONS
    this.logger.log('Step 6: Saving suggested precedents to database...');
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

    this.logger.log(`Full analysis completed for Petição ID: ${peticaoId}`);

    return {
      peticaoId,
      resumo: null,
      precedentes: formattedPrecedents,
    };
  }
}
