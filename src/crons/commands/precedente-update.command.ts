/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { PrecedenteUpdateService } from '../jobs/precedente-update.cron';

@Command({
  name: 'update:precedentes',
  description: 'Run precedentes update job manually',
})
export class PrecedenteUpdateCommand extends CommandRunner {
  private readonly logger = new Logger(PrecedenteUpdateCommand.name);

  constructor(private readonly service: PrecedenteUpdateService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Executing precedentes update via CLI...');

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
