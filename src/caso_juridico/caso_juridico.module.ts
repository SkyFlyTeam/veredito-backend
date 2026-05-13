import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasoJuridicoEntity } from './entity/caso_juridico.entity';
import { CasoPrecedenteSugeridoEntity } from './entity/caso_precedente_sugerido.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CasoJuridicoEntity,
      CasoPrecedenteSugeridoEntity,
    ]),
  ],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class CasoJuridicoModule {}
