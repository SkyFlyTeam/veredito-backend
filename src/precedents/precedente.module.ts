import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeticaoEntity } from './entity/preticao.entity';
import PrecedenteEntity from './entity/precedente.entity';
import { EspeciePrecedenteEntity } from './entity/especie_precedente.entity';
import { TribunalPrecedenteEntity } from './entity/tribunal_precedente.entity';
import { StatusPrecedenteEntity } from './entity/status_precedente.entity';
import { PrecedenteSugeridoEntity } from './entity/precedente_sugerido.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PeticaoEntity,
      PrecedenteEntity,
      EspeciePrecedenteEntity,
      TribunalPrecedenteEntity,
      StatusPrecedenteEntity,
      PrecedenteSugeridoEntity,
    ]),
  ],
  providers: [],
  controllers: [],
  exports: [],
})
export class PrecedenteModule {}
