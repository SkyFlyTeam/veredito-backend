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
import { PeticaoEntity } from 'src/peticao/entity/peticao.entity';
import { PrecedenteSugeridoEntity } from 'src/precedents/entity/precedente_sugerido.entity';
import { PeticaoDeleteCronService } from './jobs/peticao-delete.cron';
import { PeticaoModule } from 'src/peticao/peticao.module';
import { DeletePeticaoCommand } from './commands/peticao-delete.command';

@Module({
  imports: [
    CommandRunnerModule,
    EmbeddingsModule,
    PeticaoModule,
    TypeOrmModule.forFeature([
      EspeciePrecedenteEntity,
      TribunalPrecedenteEntity,
      PrecedenteEntity,
      StatusPrecedenteEntity,
      PeticaoEntity,
      PrecedenteSugeridoEntity,
    ]),
  ],
  providers: [
    UpdateEspecieCommand,
    UpdateEspecieTribunalService,
    PrecedenteUpdateCommand,
    PrecedenteUpdateService,
    GerarEmbeddingsPrecedenteCron,
    GerarEmbeddingsPrecedenteCommand,
    PeticaoDeleteCronService,
    DeletePeticaoCommand,
  ],
})
export class JobsModule {}
