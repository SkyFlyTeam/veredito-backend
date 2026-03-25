import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import PrecedenteEntity from './entity/precedente.entity';
import { EspeciePrecedenteEntity } from './entity/especie_precedente.entity';
import { TribunalPrecedenteEntity } from './entity/tribunal_precedente.entity';
import { StatusPrecedenteEntity } from './entity/status_precedente.entity';
import { PrecedenteSugeridoEntity } from './entity/precedente_sugerido.entity';
import { PrecedenteService } from './service/precedente.service';
import { PrecedenteController } from './controller/precedente.controller';
import { EspeciePrecedenteService } from './service/especie-precedente.service';
import { StatusPrecedenteService } from './service/status-precedente.service';
import { TribunalPrecedenteService } from './service/tribunal-precedente.service';
import { EspeciePrecedenteController } from './controller/especie-precedente.controller';
import { StatusPrecedenteController } from './controller/status-precedente.controller';
import { TribunalPrecedenteController } from './controller/tribunal-precedente.controller';
import { PrecedenteSugeridoService } from './service/precedente_sugerido.service';
import { PrecedenteSugeridoController } from './controller/precedente-sugerido.controller';
import { UpdateEspecieTribunalService } from '../crons/jobs/especie-tribunal-update.cron';
import { StatusPrecedenteSeed } from './seed/status.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrecedenteEntity,
      EspeciePrecedenteEntity,
      TribunalPrecedenteEntity,
      StatusPrecedenteEntity,
      PrecedenteSugeridoEntity,
    ]),
  ],
  providers: [
    PrecedenteService,
    EspeciePrecedenteService,
    StatusPrecedenteService,
    TribunalPrecedenteService,
    PrecedenteSugeridoService,
    UpdateEspecieTribunalService,
    StatusPrecedenteSeed,
  ],
  controllers: [
    PrecedenteController,
    EspeciePrecedenteController,
    StatusPrecedenteController,
    TribunalPrecedenteController,
    PrecedenteSugeridoController,
  ],
  exports: [
    PrecedenteService,
    EspeciePrecedenteService,
    StatusPrecedenteService,
    TribunalPrecedenteService,
    PrecedenteSugeridoService,
    UpdateEspecieTribunalService,
  ],
})
export class PrecedenteModule {}
