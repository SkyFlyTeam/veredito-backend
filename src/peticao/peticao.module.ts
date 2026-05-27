import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandRunnerModule } from 'nest-commander';
import { PeticaoEntity } from './entity/peticao.entity';
import { PeticaoService } from './service/peticao.service';
import { PeticaoController } from './controller/peticao.controller';
import { WordProcessingService } from './pipeline-services/word_processing/word-processing.service';
import { TextProcessingService } from './pipeline-services/word_processing/text-processing.service';
import { PipelineOrchestrator } from './pipeline-services/pipeline_orchestror';
import { PipelinePersistenceService } from './pipeline-services/service/pipeline-persistence.service';
import { SummaryService } from './pipeline-services/summary/summary.service';
import { ResumeService } from './pipeline-services/resume/resume.service';
import { BuildSummaryTextStep } from './pipeline-services/steps/build-summary-text.step';
import { ExtractFileTextStep } from './pipeline-services/steps/extract-file-text.step';
import { GenerateEmbeddingStep } from './pipeline-services/steps/generate-embedding.step';
import { GenerateSummaryStep } from './pipeline-services/steps/generate-summary.step';
import { GenerateSynthesisStep } from './pipeline-services/steps/generate-synthesis.step';
import { SearchPrecedentsStep } from './pipeline-services/steps/search-precedents.step';
import { RunPipelineCommand } from './commands/run-pipeline.command';
import { RunPipelineBatchCommand } from './commands/run-pipeline-batch.command';
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
  controllers: [PeticaoController],
  providers: [
    PeticaoService,
    WordProcessingService,
    TextProcessingService,
    PipelineOrchestrator,
    PipelinePersistenceService,
    ExtractFileTextStep,
    GenerateSummaryStep,
    BuildSummaryTextStep,
    GenerateEmbeddingStep,
    SearchPrecedentsStep,
    GenerateSynthesisStep,
    SummaryService,
    ResumeService,
    RunPipelineCommand,
    RunPipelineBatchCommand,
    BenchmarkPipelineCommand,
  ],
  exports: [
    PeticaoService,
    WordProcessingService,
    TextProcessingService,
    PipelineOrchestrator,
  ],
})
export class PeticaoModule {}
