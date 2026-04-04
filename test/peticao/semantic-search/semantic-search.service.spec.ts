import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SemanticSearchService } from '../../../src/peticao/semantic-search/service/semantic-search.service';
import PrecedenteEntity from '../../../src/precedents/entity/precedente.entity';

describe('SemanticSearchService', () => {
  let service: SemanticSearchService;
  let mockRepository: jest.Mocked<any>;

  beforeEach(async () => {
    mockRepository = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticSearchService,
        {
          provide: getRepositoryToken(PrecedenteEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SemanticSearchService>(SemanticSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call repository query with JSON stringified embedding', async () => {
    const embedding = [0.1, 0.2, 0.3];
    const mockResult = [
      {
        id: 1,
        tese: 'test thesis',
        questao: 'test question',
        score: 0.5,
      },
    ];

    mockRepository.query.mockResolvedValue(mockResult);

    const result = await service.searchSimilar(embedding);

    expect(mockRepository.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [JSON.stringify(embedding)]
    );
    expect(result).toEqual(mockResult);
  });

  it('should handle empty results from database', async () => {
    const embedding = [0.1, 0.2, 0.3];
    mockRepository.query.mockResolvedValue([]);

    const result = await service.searchSimilar(embedding);

    expect(result).toEqual([]);
    expect(mockRepository.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [JSON.stringify(embedding)]
    );
  });

  it('should handle database errors gracefully', async () => {
    const embedding = [0.1, 0.2, 0.3];
    mockRepository.query.mockRejectedValue(new Error('Database error'));

    await expect(service.searchSimilar(embedding)).rejects.toThrow('Database error');
  });

  it('should pass the correct SQL query with vector operations', async () => {
    const embedding = [0.1, 0.2, 0.3];
    mockRepository.query.mockResolvedValue([]);

    await service.searchSimilar(embedding);

    const query = mockRepository.query.mock.calls[0][0];
    
    expect(query).toContain('COALESCE(p.tese_vetor <=> $1::vector, 1)');
    expect(query).toContain('COALESCE(p.questao_vetor <=> $1::vector, 1)');
    expect(query).toContain('LEAST(');
    expect(query).toContain(') AS score');
    expect(query).toContain('ORDER BY score DESC');
    expect(query).toContain('LIMIT 10');
  });

  it('should handle large embedding arrays', async () => {
    const embedding = Array.from({ length: 1536 }, (_, i) => i / 1536);
    mockRepository.query.mockResolvedValue([]);

    const result = await service.searchSimilar(embedding);

    expect(mockRepository.query).toHaveBeenCalledWith(
      expect.any(String),
      [JSON.stringify(embedding)]
    );
    expect(result).toEqual([]);
  });
});
