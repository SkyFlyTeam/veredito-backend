/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { GerarEmbeddingsPrecedenteCron } from '../jobs/gerar-embeddings-precedente.cron';

@Command({
  name: 'embeddings:precedentes',
  description:
    'Generate embeddings for precedentes with tese or questao fields',
})
export class GerarEmbeddingsPrecedenteCommand extends CommandRunner {
  private readonly logger = new Logger(GerarEmbeddingsPrecedenteCommand.name);

  constructor(private readonly service: GerarEmbeddingsPrecedenteCron) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Executing embeddings generation via CLI...');

    const start = Date.now();

    try {
      await this.service.handleCron();

      const duration = ((Date.now() - start) / 1000).toFixed(2);

      this.logger.log(`Job finished successfully in ${duration}s`);
    } catch (error) {
      this.logger.error('Job failed', error.stack);
    }
  }
}
