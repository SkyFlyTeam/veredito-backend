import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CasoJuridicoEntity } from './entity/caso_juridico.entity';
import { CasoPrecedenteSugeridoEntity } from './entity/caso_precedente_sugerido.entity';
import { SecoesPeticaoEntity } from './entity/secoes_peticao.entity';
import { CasoJuridicoExtractionService } from './service/caso-juridico-extraction.service';
import { CasoJuridicoExtractionController } from './controller/caso-juridico-extraction.controller';
import { CasoJuridicoCrudService } from './service/caso-juridico-crud.service';
import { CasoJuridicoCrudController } from './controller/caso-juridico-crud-controller';
import { CasoJuridicoService } from './service/caso-juridico.service';
import { CasoJuridicoController } from './controller/caso-juridico.controller';
import { WordProcessingService } from '../peticao/pipeline-services/word_processing/word-processing.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      CasoJuridicoEntity,
      CasoPrecedenteSugeridoEntity,
      SecoesPeticaoEntity,
    ]),
  ],
  providers: [
    CasoJuridicoExtractionService,
    CasoJuridicoCrudService,
    CasoJuridicoService,
    WordProcessingService,
  ],
  controllers: [
    CasoJuridicoExtractionController,
    CasoJuridicoCrudController,
    CasoJuridicoController,
  ],
  exports: [TypeOrmModule, CasoJuridicoExtractionService],
})
export class CasoJuridicoModule {}
