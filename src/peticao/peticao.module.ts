import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeticaoEntity } from './entity/peticao.entity';
import { PeticaoService } from './service/peticao.service';
import { PeticaoController } from './controller/peticao.controller';
import { WordProcessingService } from './pipeline-services/word_processing/word-processing.service';
import { TextProcessingService } from './pipeline-services/word_processing/text-processing.service';
import { PipelineOrchestrator } from './pipeline-services/pipeline_orchestror';

@Module({
  imports: [TypeOrmModule.forFeature([PeticaoEntity])],
  controllers: [PeticaoController],
  providers: [PeticaoService, WordProcessingService, TextProcessingService, PipelineOrchestrator],
  exports: [PeticaoService, WordProcessingService, TextProcessingService, PipelineOrchestrator],
})
export class PeticaoModule { }
