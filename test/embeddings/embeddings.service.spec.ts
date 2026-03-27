import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import OpenAI from 'openai';
import { EmbeddingsService } from '../../src/embeddings/embeddings.service';

jest.mock('openai');

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.resetAllMocks();

    mockOpenAI = {
      embeddings: {
        create: jest.fn(),
      },
    } as any;
    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAI);

    service = new EmbeddingsService();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmbedding', () => {
    it('deve retornar o vetor de embedding quando a chamada para OpenAI for bem-sucedida', async () => {
      const text = 'texto de teste';
      const mockEmbedding = [0.1, 0.2, 0.3];
      
      const mockResponse = {
        data: [{ embedding: mockEmbedding, index: 0, object: 'embedding' }],
        model: 'text-embedding-3-large',
        object: 'list',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      };

      (mockOpenAI.embeddings.create as any).mockResolvedValueOnce(mockResponse);

      const result = await service.generateEmbedding(text);

      expect(result).toEqual(mockEmbedding);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-large',
        input: text,
      });
    });

    it('deve lançar erro quando a chamada para OpenAI falhar', async () => {
      const text = 'texto de teste';
      const mockError = new Error('OpenAI Error');

      (mockOpenAI.embeddings.create as any).mockRejectedValueOnce(mockError);

      await expect(service.generateEmbedding(text)).rejects.toThrow('OpenAI Error');
    });
  });
});
