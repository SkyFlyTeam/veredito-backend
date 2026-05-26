import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessoController } from './controller/processo.controller';
import { TextSearchPartsService } from './service/text-search-parts.service';
import { ProcessoService } from './service/processo.service';
import { ProcessInformationService } from './service/process-information.service';
import { WordProcessingService } from 'src/peticao/pipeline-services/word_processing/word-processing.service';
import ProcessoJuridicoEntity from './entity/processo_juridico.entity';
import TipoPecaEntity from './entity/tipo_peca.entity';
import PecaEntity from './entity/peca.entity';
import { TipoPecaSeed } from './seed/tipo-peca.seed';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ProcessoJuridicoEntity,
      TipoPecaEntity,
      PecaEntity,
    ]),
  ],
  controllers: [ProcessoController],
  providers: [TextSearchPartsService, ProcessoService, ProcessInformationService, WordProcessingService, TipoPecaSeed],
  exports: [TextSearchPartsService, ProcessoService, ProcessInformationService],
})
export class ProcessoModule { }
