import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemanticSearchController } from './controller/semantic-search.controller';
import { SemanticSearchService } from './service/semantic-search.service';
import PrecedenteEntity from 'src/precedents/entity/precedente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrecedenteEntity])],
  controllers: [SemanticSearchController],
  providers: [SemanticSearchService],
  exports: [SemanticSearchService],
})
export class SemanticSearchModule {}
