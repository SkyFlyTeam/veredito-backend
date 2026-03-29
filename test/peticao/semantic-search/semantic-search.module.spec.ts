import { Test, TestingModule } from '@nestjs/testing';
import { SemanticSearchModule } from '../../../src/peticao/semantic-search/semantic-search.module';
import { SemanticSearchService } from '../../../src/peticao/semantic-search/service/semantic-search.service';
import { SemanticSearchController } from '../../../src/peticao/semantic-search/controller/semantic-search.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import PrecedenteEntity from '../../../src/precedents/entity/precedente.entity';

describe('SemanticSearchModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SemanticSearchModule],
    })
      .overrideProvider(getRepositoryToken(PrecedenteEntity))
      .useValue({
        query: jest.fn(),
      })
      .compile();
  });

  it('should compile the module', async () => {
    expect(module).toBeDefined();
  });

  it('should provide SemanticSearchService', () => {
    const service = module.get<SemanticSearchService>(SemanticSearchService);
    expect(service).toBeDefined();
  });

  it('should provide SemanticSearchController', () => {
    const controller = module.get<SemanticSearchController>(SemanticSearchController);
    expect(controller).toBeDefined();
  });

  it('should export SemanticSearchService', () => {
    const service = module.get<SemanticSearchService>(SemanticSearchService);
    expect(service).toBeDefined();
  });

  afterEach(async () => {
    await module.close();
  });
});
