import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CasoJuridicoEntity } from './entity/caso_juridico.entity';
import { CasoPrecedenteSugeridoEntity } from './entity/caso_precedente_sugerido.entity';
import { SecoesPeticaoEntity } from './entity/secoes_peticao.entity';
import { CasoJuridicoExtractionService } from './service/caso-juridico-extraction.service';
import { CasoJuridicoCrudService } from './service/caso-juridico-crud.service';
import { CasoJuridicoService } from './service/caso-juridico.service';
import { CasoJuridicoController } from './controller/caso-juridico.controller';
import { PdfGeneratorService } from './service/pdf-generator.service';
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
    PdfGeneratorService,
    WordProcessingService,
  ],
  controllers: [CasoJuridicoController],
  exports: [TypeOrmModule, CasoJuridicoExtractionService, CasoJuridicoService],
})
export class CasoJuridicoModule {}
