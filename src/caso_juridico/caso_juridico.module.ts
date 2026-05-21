import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CasoJuridicoEntity } from './entity/caso_juridico.entity';
import { CasoPrecedenteSugeridoEntity } from './entity/caso_precedente_sugerido.entity';
import { SecoesPeticaoEntity } from './entity/secoes_peticao.entity';
import { CasoJuridicoService } from './service/caso-juridico.service';
import { CasoJuridicoController } from './controller/caso-juridico.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      CasoJuridicoEntity,
      CasoPrecedenteSugeridoEntity,
      SecoesPeticaoEntity,
    ]),
  ],
  providers: [CasoJuridicoService],
  controllers: [CasoJuridicoController],
  exports: [TypeOrmModule, CasoJuridicoService],
})
export class CasoJuridicoModule { }
