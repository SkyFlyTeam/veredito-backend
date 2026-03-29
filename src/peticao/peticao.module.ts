import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandRunnerModule } from 'nest-commander';
import { PeticaoEntity } from './entity/peticao.entity';
import { PeticaoService } from './service/peticao.service';
import { PeticaoController } from './controller/peticao.controller';
import { WordProcessingService } from './pipeline-services/word_processing/word-processing.service';
import { TextProcessingService } from './pipeline-services/word_processing/text-processing.service';
import { PipelineOrchestrator } from './pipeline-services/pipeline_orchestror';
import { RunPipelineCommand } from './commands/run-pipeline.command';
import { SemanticSearchModule } from './semantic-search/semantic-search.module';

@Module({
  imports: [
    CommandRunnerModule,
    TypeOrmModule.forFeature([PeticaoEntity]),
    SemanticSearchModule,
  ],
  controllers: [PeticaoController],
  providers: [
    PeticaoService,
    WordProcessingService,
    TextProcessingService,
    PipelineOrchestrator,
    RunPipelineCommand,
  ],
  exports: [
    PeticaoService,
    WordProcessingService,
    TextProcessingService,
    PipelineOrchestrator,
  ],
})
export class PeticaoModule {}
