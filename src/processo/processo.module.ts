import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessoController } from './controller/processo.controller';
import { TextSearchPartsService } from './service/text-search-parts.service';
import { ProcessoService } from './service/processo.service';
import { ProcessInformationService } from './service/process-information.service';
import { WordProcessingService } from 'src/peticao/pipeline-services/word_processing/word-processing.service';
import { MinutaSentencaService } from './service/minuta-sentenca.service';
import ProcessoJuridicoEntity from './entity/processo_juridico.entity';
import TipoPecaEntity from './entity/tipo_peca.entity';
import PecaEntity from './entity/peca.entity';
import { TipoPecaSeed } from './seed/tipo-peca.seed';
import { PeticaoModule } from '../peticao/peticao.module';
import { PrecedenteSugeridoEntity } from '../precedents/entity/precedente_sugerido.entity';
import { ProcessoPipelineOrchestrator } from './pipeline-services/processo_pipeline_orchestror';
import { ProcessoPipelinePersistenceService } from './pipeline-services/service/processo-pipeline-persistence.service';
import { BuildProcessPiecesStep } from './pipeline-services/steps/build-process-pieces.step';
import { ExtractProcessDocumentStep } from './pipeline-services/steps/extract-process-document.step';
import { ExtractProcessGeneralInfoStep } from './pipeline-services/steps/extract-process-general-info.step';
import { SearchProcessPiecesStep } from './pipeline-services/steps/search-process-pieces.step';

@Module({
  imports: [
    ConfigModule,
    PeticaoModule,
    TypeOrmModule.forFeature([
      ProcessoJuridicoEntity,
      TipoPecaEntity,
      PecaEntity,
      PrecedenteSugeridoEntity,
    ]),
  ],
  controllers: [ProcessoController],
  providers: [
    TextSearchPartsService,
    ProcessoService,
    ProcessInformationService,
    WordProcessingService,
    TipoPecaSeed,
    MinutaSentencaService,
    ProcessoPipelineOrchestrator,
    ProcessoPipelinePersistenceService,
    ExtractProcessDocumentStep,
    SearchProcessPiecesStep,
    BuildProcessPiecesStep,
    ExtractProcessGeneralInfoStep,
  ],
  exports: [
    TextSearchPartsService,
    ProcessoService,
    ProcessInformationService,
    MinutaSentencaService,
    ProcessoPipelineOrchestrator,
  ],
})
export class ProcessoModule {}
