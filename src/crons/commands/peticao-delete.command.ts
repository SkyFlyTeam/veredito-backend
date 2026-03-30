import { Command, CommandRunner } from 'nest-commander';
import { PeticaoDeleteCronService } from '../jobs/peticao-delete.cron';

@Command({
  name: 'delete:peticao',
  description: 'Run delete peticao job',
})
export class DeletePeticaoCommand extends CommandRunner {
  constructor(private readonly service: PeticaoDeleteCronService) {
    super();
  }

  async run(): Promise<void> {
    console.log('Running CLI command...');
    await this.service.handleCron();
    console.log('Finished CLI command');
  }
}
