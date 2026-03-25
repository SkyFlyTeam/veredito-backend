import { Command, CommandRunner } from 'nest-commander';
import { UpdateEspecieTribunalService } from '../jobs/especie-tribunal-update.cron';

@Command({
  name: 'update:especies-tribunais',
  description: 'Run update especies/tribunais job',
})
export class UpdateEspecieCommand extends CommandRunner {
  constructor(private readonly service: UpdateEspecieTribunalService) {
    super();
  }

  async run(): Promise<void> {
    console.log('Running CLI command...');
    await this.service.handleCron();
    console.log('Finished CLI command');
  }
}
