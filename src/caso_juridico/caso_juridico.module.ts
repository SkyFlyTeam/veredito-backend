import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasoJuridicoEntity } from './entity/caso_juridico.entity';
import { CasoPrecedenteSugeridoEntity } from './entity/caso_precedente_sugerido.entity';
import { SecoesPeticaoEntity } from './entity/secoes_peticao.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CasoJuridicoEntity,
      CasoPrecedenteSugeridoEntity,
      SecoesPeticaoEntity,
    ]),
  ],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class CasoJuridicoModule { }
