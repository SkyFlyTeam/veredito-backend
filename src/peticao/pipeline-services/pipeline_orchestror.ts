/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PeticaoEntity } from '../entity/peticao.entity';
import { WordProcessingService } from './word_processing/word-processing.service';
import { TextProcessingService } from './word_processing/text-processing.service';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { SemanticSearchService } from '../semantic-search/service/semantic-search.service';
import { PrecedenteSugeridoService } from '../../precedents/service/precedente_sugerido.service';
import { SynthesisService } from '../../synthesis/synthesis.service';
import { SummaryService } from './summary/summary.service';
import { ResumeService } from './resume/resume.service';
import {
  PipelineEvent,
  SearchEvent,
  SynthesisEvent,
  ResumoEvent,
  CompleteEvent,
  ErrorEvent,
} from '../dto/pipeline-event.dto';

@Injectable()
export class PipelineOrchestrator {
  private readonly logger = new Logger(PipelineOrchestrator.name);

  constructor(
    private readonly wordProcessingService: WordProcessingService,
    private readonly textProcessingService: TextProcessingService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly semanticSearchService: SemanticSearchService,
    private readonly precedenteSugeridoService: PrecedenteSugeridoService,
    private readonly synthesisService: SynthesisService,
    private readonly summaryService: SummaryService,
    private readonly resumeService: ResumeService,

    @InjectRepository(PeticaoEntity)
    private readonly peticaoRepository: Repository<PeticaoEntity>,
  ) {}

  run(peticaoId: number): Observable<PipelineEvent> {
    return new Observable<PipelineEvent>((observer) => {
      const pipelineStart = Date.now();

      this.logger.log(
        `[PIPELINE SSE] Iniciando stream da petição ${peticaoId}`,
      );

      const emitError = (
        failedStage: ErrorEvent['data']['failedStage'],
        error: unknown,
        precedentId?: number,
        recoverable = false,
      ) => {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';

        this.logger.error(
          `[PIPELINE SSE][${failedStage}] ${message}`,
          error instanceof Error ? error.stack : undefined,
        );

        const event: ErrorEvent = {
          stage: 'error',
          status: 'error',
          timestamp: new Date(),
          duration: Date.now() - pipelineStart,
          data: {
            failedStage,
            message,
            errorCode: 'PIPELINE_STREAM_ERROR',
            precedentId,
            recoverable,
            suggestedAction: recoverable
              ? 'Continue processando os demais precedentes.'
              : 'Verifique os logs do backend.',
          },
        };

        observer.next(event);
      };

      const execute = async () => {
        try {
          // =====================================================
          // PASSO 0 — Buscar petição no banco
          // =====================================================
          this.logger.log(`[PASSO 0] Buscando petição ID ${peticaoId}`);

          const peticao = await this.peticaoRepository.findOne({
            where: { id: peticaoId },
          });

          if (!peticao) {
            throw new NotFoundException(
              `Petição com ID ${peticaoId} não encontrada`,
            );
          }

          this.logger.log(`[PASSO 0] Petição encontrada: ${peticaoId}`);

          // =====================================================
          // PASSO 1 — Extração do texto bruto do arquivo
          // =====================================================
          this.logger.log(`[PASSO 1] Extraindo texto da petição ${peticaoId}`);

          const rawText = await this.wordProcessingService.extractTextFromPath(
            peticao.caminhoArquivo,
          );

          this.logger.log(
            `[PASSO 1] Texto extraído com ${rawText?.length ?? 0} caracteres`,
          );

          if (!rawText) {
            throw new Error('Falha ao extrair texto do arquivo da petição.');
          }

          // =====================================================
          // PASSO 2 — Geração de resumo com OpenAI
          // =====================================================
          this.logger.log(
            `[PASSO 2] Gerando resumo com OpenAI para petição ${peticaoId}`,
          );

          const summary = await this.summaryService.summarize(rawText);

          this.logger.log(
            `[PASSO 2] Resumo gerado - Tese: ${summary.teseJuridica?.length ?? 0} chars, Pedido: ${summary.solicitacaoPedido?.length ?? 0} chars`,
          );

          // =====================================================
          // PASSO 3 — Salvar resumo gerado no banco
          // =====================================================
          this.logger.log(
            `[PASSO 3] Salvando resumo no banco para petição ${peticaoId}`,
          );

          const resumeStart = Date.now();

          const peticaoComResumo = await this.resumeService.saveResume(
            peticaoId,
            summary,
          );

          const resumoEvent: ResumoEvent = {
            stage: 'resumo',
            status: 'success',
            timestamp: new Date(),
            duration: Date.now() - resumeStart,
            data: {
              resumo: peticaoComResumo.resumo || '',
            },
          };

          observer.next(resumoEvent);

          this.logger.log(
            `[PASSO 3] Resumo salvo e evento SSE enviado (${peticaoComResumo.resumo?.length ?? 0} caracteres)`,
          );

          // =====================================================
          // PASSO 4 — Processamento NLP / limpeza textual
          // =====================================================
          this.logger.log(
            `[PASSO 4] Processando texto da petição ${peticaoId}`,
          );

          const processedText = this.textProcessingService.process(rawText);

          this.logger.log(
            `[PASSO 4] Texto processado com ${processedText?.length ?? 0} caracteres`,
          );

          // =====================================================
          // PASSO 5 — Preparação e geração de embedding
          // =====================================================
          this.logger.log(
            `[PASSO 5] Gerando embedding da petição ${peticaoId}`,
          );

          // Usar o resumo gerado pela OpenAI para embedding em vez do texto processado
          const summaryText =
            `${summary.teseJuridica}\n${summary.solicitacaoPedido}`
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 3000);

          const embedding =
            await this.embeddingsService.generateEmbedding(summaryText);

          this.logger.log(
            `[PASSO 5] Embedding gerado com dimensão ${embedding.length} usando resumo OpenAI`,
          );

          // =====================================================
          // PASSO 6 — Persistir vetores na petição
          // =====================================================
          this.logger.log(`[PASSO 6] Salvando vetores da petição ${peticaoId}`);

          peticao.teseVetor = embedding;
          peticao.questaoVetor = embedding;
          await this.peticaoRepository.save(peticao);

          this.logger.log(`[PASSO 6] Vetores salvos com sucesso`);

          // =====================================================
          // PASSO 7 — Busca vetorial por precedentes similares
          // =====================================================
          this.logger.log(`[PASSO 7] Executando busca vetorial`);

          const searchStart = Date.now();

          const suggestedPrecedents =
            await this.semanticSearchService.searchSimilar(embedding);

          this.logger.log(
            `[PASSO 7] Busca finalizada. Total encontrado: ${suggestedPrecedents.length}`,
          );

          const averageSimilarityScore =
            suggestedPrecedents.length > 0
              ? suggestedPrecedents.reduce(
                  (acc, item) => acc + Number(item.score ?? 0),
                  0,
                ) / suggestedPrecedents.length
              : 0;

          // =====================================================
          // PASSO 8 — Criar registros iniciais de precedentes sugeridos
          // =====================================================
          this.logger.log(`[PASSO 8] Salvando sugestões iniciais`);

          const searchDtos = suggestedPrecedents.map((match, index) => ({
            percentual_similaridade: match.score
              ? Number((((match.score + 1) / 2) * 100).toFixed(2))
              : 0,
            classificacao: index + 1,
            sintese_explicativa: '',
            precedente_id: match.id,
            peticao_id: peticao.id,
          }));

          await this.precedenteSugeridoService.createBulk(searchDtos);

          const searchEvent: SearchEvent = {
            stage: 'search',
            status: 'success',
            timestamp: new Date(),
            duration: Date.now() - searchStart,
            data: {
              precedents: suggestedPrecedents,
              totalFound: suggestedPrecedents.length,
              averageSimilarityScore,
            },
          };

          observer.next(searchEvent);

          this.logger.log(`[PASSO 8] Evento SSE search enviado`);

          // =====================================================
          // PASSO 9 — Gerar síntese/classificação para cada precedente
          // =====================================================
          this.logger.log(`[PASSO 9] Iniciando sínteses dos precedentes`);

          let synthesisGenerated = 0;

          for (const [index, match] of suggestedPrecedents.entries()) {
            const synthesisStart = Date.now();

            try {
              this.logger.log(
                `[PASSO 9.${index + 1}] Gerando síntese para precedente ${match.id}`,
              );

              // Usar o resumo gerado pela OpenAI em vez do texto bruto
              const summaryText = `${summary.teseJuridica}\n${summary.solicitacaoPedido}`;

              const result = await this.synthesisService.generateSynthesis(
                summaryText,
                match.tese ||
                  match.questao ||
                  'Texto do precedente indisponível',
              );

              const updatedData = {
                percentual_similaridade: match.score
                  ? Number((((match.score + 1) / 2) * 100).toFixed(2))
                  : 0,
                classificacao: result.classificacao,
                sintese_explicativa: result.sintese,
                precedente_id: match.id,
                peticao_id: peticao.id,
              };

              const [saved] = await this.precedenteSugeridoService.createBulk([
                updatedData,
              ]);

              synthesisGenerated++;

              const synthesisEvent: SynthesisEvent = {
                stage: 'synthesis',
                status: 'success',
                timestamp: new Date(),
                duration: Date.now() - synthesisStart,
                data: saved,
              };

              observer.next(synthesisEvent);

              this.logger.log(
                `[PASSO 9.${index + 1}] Síntese enviada via SSE para precedente ${match.id}`,
              );
            } catch (error) {
              emitError('synthesis', error, match.id, true);
            }
          }

          // =====================================================
          // PASSO 10 — Finalizar pipeline SSE
          // =====================================================
          const totalDurationMs = Date.now() - pipelineStart;

          this.logger.log(
            `[PASSO 10] Pipeline finalizada em ${totalDurationMs}ms. Sínteses geradas: ${synthesisGenerated}`,
          );

          const completeEvent: CompleteEvent = {
            stage: 'complete',
            status: 'success',
            timestamp: new Date(),
            duration: totalDurationMs,
            data: {
              totalDurationMs,
              precedentsProcessed: suggestedPrecedents.length,
              synthesisGenerated,
            },
          };

          observer.next(completeEvent);
          observer.complete();
        } catch (error) {
          emitError('unknown', error, undefined, false);
          observer.complete();
        }
      };

      void execute();

      return () => {
        this.logger.log(
          `[PIPELINE SSE] Cliente desconectou do stream da petição ${peticaoId}`,
        );
      };
    });
  }
}
