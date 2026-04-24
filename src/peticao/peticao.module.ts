import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandRunnerModule } from 'nest-commander';
import { PeticaoEntity } from './entity/peticao.entity';
import { PeticaoService } from './service/peticao.service';
import { PeticaoController } from './controller/peticao.controller';
import { PeticaoStreamController } from './controller/peticao-stream.controller';
import { WordProcessingService } from './pipeline-services/word_processing/word-processing.service';
import { TextProcessingService } from './pipeline-services/word_processing/text-processing.service';
import { PipelineOrchestrator } from './pipeline-services/pipeline_orchestror';
import { SummaryService } from './pipeline-services/summary/summary.service';
import { RunPipelineCommand } from './commands/run-pipeline.command';
import { BenchmarkPipelineCommand } from './commands/benchmark-pipeline.command';
import { SemanticSearchModule } from './semantic-search/semantic-search.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { PrecedenteModule } from '../precedents/precedente.module';
import { UserEntity } from '../account/user/entity/user.entity';
import { SynthesisModule } from '../synthesis/synthesis.module';

@Module({
  imports: [
    CommandRunnerModule,
    TypeOrmModule.forFeature([PeticaoEntity, UserEntity]),
    SemanticSearchModule,
    EmbeddingsModule,
    PrecedenteModule,
    SynthesisModule,
  ],
  controllers: [PeticaoController, PeticaoStreamController],
  providers: [
    PeticaoService,
    WordProcessingService,
    TextProcessingService,
    PipelineOrchestrator,
    SummaryService,
    RunPipelineCommand,
    BenchmarkPipelineCommand,
  ],
  exports: [
    PeticaoService,
    WordProcessingService,
    TextProcessingService,
    PipelineOrchestrator,
  ],
})
export class PeticaoModule { }
