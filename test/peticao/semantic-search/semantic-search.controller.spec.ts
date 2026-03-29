import { Test, TestingModule } from '@nestjs/testing';
import { SemanticSearchController } from '../../../src/peticao/semantic-search/controller/semantic-search.controller';
import { SemanticSearchService } from '../../../src/peticao/semantic-search/service/semantic-search.service';
import { SemanticSearchDto } from '../../../src/peticao/semantic-search/dto/semantic-search.dto';

describe('SemanticSearchController', () => {
  let controller: SemanticSearchController;
  let mockService: jest.Mocked<SemanticSearchService>;

  beforeEach(async () => {
    mockService = {
      searchSimilar: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemanticSearchController],
      providers: [
        {
          provide: SemanticSearchService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SemanticSearchController>(SemanticSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call searchSimilar service method with embedding from DTO', async () => {
    const embedding = [0.1, 0.2, 0.3];
    const mockResult = [
      {
        id: 1,
        tese: 'test thesis',
        questao: 'test question',
        score: 0.5,
      },
    ];

    const dto = new SemanticSearchDto();
    dto.embedding = embedding;

    mockService.searchSimilar.mockResolvedValue(mockResult);

    const result = await controller.search(dto);

    expect(mockService.searchSimilar).toHaveBeenCalledWith(embedding);
    expect(result).toEqual(mockResult);
  });

  it('should handle empty search results', async () => {
    const embedding = [0.1, 0.2, 0.3];
    const dto = new SemanticSearchDto();
    dto.embedding = embedding;

    mockService.searchSimilar.mockResolvedValue([]);

    const result = await controller.search(dto);

    expect(mockService.searchSimilar).toHaveBeenCalledWith(embedding);
    expect(result).toEqual([]);
  });

  it('should propagate service errors', async () => {
    const embedding = [0.1, 0.2, 0.3];
    const dto = new SemanticSearchDto();
    dto.embedding = embedding;

    mockService.searchSimilar.mockRejectedValue(new Error('Service error'));

    await expect(controller.search(dto)).rejects.toThrow('Service error');
    expect(mockService.searchSimilar).toHaveBeenCalledWith(embedding);
  });
});
