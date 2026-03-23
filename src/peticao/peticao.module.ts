import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeticaoEntity } from './entity/peticao.entity';
import { PeticaoService } from './service/peticao.service';
import { PeticaoController } from './controller/peticao.controller';
import { WordProcessingService } from './pipeline-services/word_processing/word-processing.service';

@Module({
  imports: [TypeOrmModule.forFeature([PeticaoEntity])],
  controllers: [PeticaoController],
  providers: [PeticaoService, WordProcessingService],
  exports: [PeticaoService, WordProcessingService],
})
export class PeticaoModule { }
