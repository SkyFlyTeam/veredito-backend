/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Post } from '@nestjs/common';
import { SemanticSearchService } from '../service/semantic-search.service';
import { SemanticSearchDto } from '../dto/semantic-search.dto';

@Controller('semantic-search')
export class SemanticSearchController {
  constructor(private readonly service: SemanticSearchService) {}

  @Post()
  async search(@Body() body: SemanticSearchDto) {
    return this.service.searchSimilar(body.embedding);
  }
}
