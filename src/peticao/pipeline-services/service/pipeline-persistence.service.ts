import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeticaoEntity } from '../../entity/peticao.entity';
import { PrecedenteSugeridoService } from '../../../precedents/service/precedente_sugerido.service';
import { PeticaoSummary } from '../summary/summary.service';
import {
  PipelinePrecedentMatch,
  PipelineSynthesisResult,
} from '../types/pipeline-types';

@Injectable()
export class PipelinePersistenceService {
  constructor(
    @InjectRepository(PeticaoEntity)
    private readonly peticaoRepository: Repository<PeticaoEntity>,
    private readonly precedenteSugeridoService: PrecedenteSugeridoService,
  ) {}

  async findPeticaoOrFail(peticaoId: number): Promise<PeticaoEntity> {
    const peticao = await this.peticaoRepository.findOne({
      where: { id: peticaoId },
    });

    if (!peticao) {
      throw new NotFoundException(`Petição com ID ${peticaoId} não encontrada`);
    }

    return peticao;
  }

  async savePeticaoAnalysis(
    peticao: PeticaoEntity,
    resumo: string,
    embedding: number[],
  ): Promise<void> {
    peticao.resumo = resumo;
    peticao.teseVetor = embedding;
    peticao.questaoVetor = embedding;
    await this.peticaoRepository.save(peticao);
  }

  async saveInitialSuggestions(
    peticaoId: number,
    precedents: PipelinePrecedentMatch[],
  ): Promise<void> {
    const searchDtos = precedents.map((match, index) => ({
      percentual_similaridade: this.toSimilarityPercentage(match.score),
      classificacao: index + 1,
      sintese_explicativa: '',
      precedente_id: match.id,
      peticao_id: peticaoId,
    }));

    await this.precedenteSugeridoService.createBulk(searchDtos);
  }

  async saveSynthesis(result: PipelineSynthesisResult) {
    if (!result.peticao_id) {
      return result;
    }

    const [saved] = await this.precedenteSugeridoService.createBulk([
      {
        percentual_similaridade: result.percentual_similaridade,
        classificacao: result.classificacao,
        sintese_explicativa: result.sintese_explicativa,
        precedente_id: result.precedente_id,
        peticao_id: result.peticao_id,
      },
    ]);

    return saved;
  }

  formatResume(summary: PeticaoSummary): string {
    return `TESE JURÍDICA:\n${summary.teseJuridica}\n\nSOLICITAÇÃO/PEDIDO:\n${summary.solicitacaoPedido}`;
  }

  private toSimilarityPercentage(score: number | string | undefined): number {
    return score ? Number((((Number(score) + 1) / 2) * 100).toFixed(2)) : 0;
  }
}
