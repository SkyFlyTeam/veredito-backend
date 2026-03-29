import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import PrecedenteEntity from 'src/precedents/entity/precedente.entity';
import { Repository } from 'typeorm';
import { EmbeddingsService } from 'src/embeddings/embeddings.service';

@Injectable()
export class GerarEmbeddingsPrecedenteCron {
  private readonly logger = new Logger(GerarEmbeddingsPrecedenteCron.name);
  private isRunning = false;

  private readonly BATCH_SIZE = 50;
  private readonly CONCURRENCY = 5;

  constructor(
    @InjectRepository(PrecedenteEntity)
    private readonly precedenteRepo: Repository<PrecedenteEntity>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  @Cron('20 3 * * *')
  handleCron() {
    return this.executeJob();
  }

  private async executeJob() {
    if (this.isRunning) {
      this.logger.log('Job already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting GerarEmbeddingsPrecedente job...');

    try {
      let hasMore = true;

      while (hasMore) {
        const precedentes = await this.precedenteRepo
          .createQueryBuilder('precedente')
          .where(
            `
            (
              precedente.tese IS NOT NULL 
              AND precedente.tese != :empty 
              AND precedente.tese_vetor IS NULL
            )
            OR
            (
              precedente.questao IS NOT NULL 
              AND precedente.questao != :empty 
              AND precedente.questao_vetor IS NULL
            )
          `,
            { empty: '' },
          )
          .limit(this.BATCH_SIZE)
          .getMany();

        if (precedentes.length === 0) {
          hasMore = false;
          break;
        }

        this.logger.log(`Processing batch of ${precedentes.length}`);

        // Process with concurrency control
        const processed = await this.processWithConcurrency(precedentes);

        // Bulk save
        if (processed.length > 0) {
          await this.precedenteRepo.save(processed);
        }
      }

      this.logger.log('GerarEmbeddingsPrecedente job completed');
    } catch (error) {
      this.logger.error('Error in job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processWithConcurrency(precedentes: PrecedenteEntity[]) {
    const results: PrecedenteEntity[] = [];

    const queue = [...precedentes];

    const workers = Array.from({ length: this.CONCURRENCY }).map(async () => {
      while (queue.length > 0) {
        const precedente = queue.shift();
        if (!precedente) continue;

        try {
          let needsUpdate = false;

          if (precedente.tese && !precedente.tese_vetor) {
            const embedding = await this.embeddingsService.generateEmbedding(
              precedente.tese,
            );

            precedente.tese_vetor = embedding;
            needsUpdate = true;
          }

          if (precedente.questao && !precedente.questao_vetor) {
            const embedding = await this.embeddingsService.generateEmbedding(
              precedente.questao,
            );

            precedente.questao_vetor = embedding;
            needsUpdate = true;
          }

          if (needsUpdate) {
            results.push(precedente);
          }
        } catch (error) {
          this.logger.error(
            `Error processing precedente ${precedente.id}`,
            error,
          );
        }
      }
    });

    await Promise.all(workers);

    return results;
  }
}
