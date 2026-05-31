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
import { PeticaoModule } from '../peticao/peticao.module';
import { CasoJuridicoPipelineOrchestrator } from './pipeline-services/caso_juridico_pipeline_orchestror';
import { GenerateCasoSectionsStep } from './pipeline-services/steps/generate-caso-sections.step';
import { GenerateCasoPdfStep } from './pipeline-services/steps/generate-caso-pdf.step';
import { ExtractCasoPdfTextStep } from './pipeline-services/steps/extract-caso-pdf-text.step';

@Module({
  imports: [
    ConfigModule,
    PeticaoModule,
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
    CasoJuridicoPipelineOrchestrator,
    GenerateCasoSectionsStep,
    GenerateCasoPdfStep,
    ExtractCasoPdfTextStep,
  ],
  controllers: [CasoJuridicoController],
  exports: [
    TypeOrmModule,
    CasoJuridicoExtractionService,
    CasoJuridicoService,
    CasoJuridicoPipelineOrchestrator,
  ],
})
export class CasoJuridicoModule {}
