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
import { EmbeddingsModule } from 'src/embeddings/embeddings.module';
import { GerarEmbeddingsPrecedenteCron } from './jobs/gerar-embeddings-precedente.cron';
import { GerarEmbeddingsPrecedenteCommand } from './commands/gerar-embeddings-precedente.command';

@Module({
  imports: [
    CommandRunnerModule,
    EmbeddingsModule,
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
    GerarEmbeddingsPrecedenteCron,
    GerarEmbeddingsPrecedenteCommand,
  ],
})
export class JobsModule {}
