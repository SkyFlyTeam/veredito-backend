import { Module } from '@nestjs/common';
import { ProcessoController } from './controller/processo.controller';
import { TextSearchPartsService } from './service/text-search-parts.service';
import { WordProcessingService } from 'src/peticao/pipeline-services/word_processing/word-processing.service';

@Module({
  imports: [],
  controllers: [ProcessoController],
  providers: [TextSearchPartsService, WordProcessingService],
  exports: [TextSearchPartsService],
})
export class ProcessoModule {}
