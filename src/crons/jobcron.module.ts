import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspeciePrecedenteEntity } from 'src/precedents/entity/especie_precedente.entity';
import { TribunalPrecedenteEntity } from 'src/precedents/entity/tribunal_precedente.entity';
import { UpdateEspecieCommand } from './commands/especie-tribunal-update.command';
import { UpdateEspecieTribunalService } from './jobs/especie-tribunal-update.cron';
import { CommandRunnerModule } from 'nest-commander';
import PrecedenteEntity from 'src/precedents/entity/precedente.entity';
import { StatusPrecedenteEntity } from 'src/precedents/entity/status_precedente.entity';
import { PrecedenteUpdateCommand } from './commands/precedente-update.command';
import { PrecedenteUpdateService } from './jobs/precedente-update.cron';

@Module({
  imports: [
    CommandRunnerModule,
    TypeOrmModule.forFeature([
      EspeciePrecedenteEntity,
      TribunalPrecedenteEntity,
      PrecedenteEntity,
      StatusPrecedenteEntity,
    ]),
  ],
  providers: [
    UpdateEspecieCommand,
    UpdateEspecieTribunalService,
    PrecedenteUpdateCommand,
    PrecedenteUpdateService,
  ],
})
export class JobsModule {}
