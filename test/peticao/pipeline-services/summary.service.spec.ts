import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import OpenAI from 'openai';
import { SummaryService } from '../../../src/peticao/pipeline-services/summary/summary.service';

jest.mock('openai');

const makeChatResponse = (content: string) => ({
  id: 'chatcmpl-test',
  object: 'chat.completion',
  created: 0,
  model: 'gpt-4o-mini',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
});

describe('SummaryService', () => {
  let service: SummaryService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.resetAllMocks();

    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;
    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAI);

    service = new SummaryService();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('summarize', () => {
    it('deve retornar teseJuridica e solicitacaoPedido corretamente quando o modelo responde no formato esperado', async () => {
      const rawText = 'Texto de exemplo de uma petição jurídica.';
      const modelContent =
        'TESE JURÍDICA:\nO réu violou o artigo 5º da CF ao negar acesso a documentos públicos.\n\nSOLICITAÇÃO/PEDIDO:\nRequer-se a condenação do réu à entrega dos documentos no prazo de 10 dias.';

      (mockOpenAI.chat.completions.create as any).mockResolvedValueOnce(
        makeChatResponse(modelContent),
      );

      const result = await service.summarize(rawText);

      expect(result.teseJuridica).toBe(
        'O réu violou o artigo 5º da CF ao negar acesso a documentos públicos.',
      );
      expect(result.solicitacaoPedido).toBe(
        'Requer-se a condenação do réu à entrega dos documentos no prazo de 10 dias.',
      );
    });

    it('deve usar o modelo gpt-4o-mini', async () => {
      (mockOpenAI.chat.completions.create as any).mockResolvedValueOnce(
        makeChatResponse('TESE JURÍDICA:\nTese.\n\nSOLICITAÇÃO/PEDIDO:\nPedido.'),
      );

      await service.summarize('qualquer texto');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o-mini' }),
      );
    });

    it('deve truncar textos maiores que 12000 caracteres no prompt', async () => {
      const longText = 'a'.repeat(20000);
      (mockOpenAI.chat.completions.create as any).mockResolvedValueOnce(
        makeChatResponse('TESE JURÍDICA:\nTese.\n\nSOLICITAÇÃO/PEDIDO:\nPedido.'),
      );

      await service.summarize(longText);

      const callArg = (mockOpenAI.chat.completions.create as any).mock.calls[0][0] as any;
      const userMessage = callArg.messages.find((m: any) => m.role === 'user').content as string;
      expect(userMessage).toContain('a'.repeat(12000));
      expect(userMessage).not.toContain('a'.repeat(12001));
    });

    it('deve truncar teseJuridica para no máximo 5 linhas', async () => {
      const tese6Linhas = 'linha1\nlinha2\nlinha3\nlinha4\nlinha5\nlinha6';
      const modelContent = `TESE JURÍDICA:\n${tese6Linhas}\n\nSOLICITAÇÃO/PEDIDO:\nPedido.`;

      (mockOpenAI.chat.completions.create as any).mockResolvedValueOnce(
        makeChatResponse(modelContent),
      );

      const result = await service.summarize('texto');

      expect(result.teseJuridica.split('\n')).toHaveLength(5);
    });

    it('deve truncar solicitacaoPedido para no máximo 3 linhas', async () => {
      const pedido4Linhas = 'linha1\nlinha2\nlinha3\nlinha4';
      const modelContent = `TESE JURÍDICA:\nTese.\n\nSOLICITAÇÃO/PEDIDO:\n${pedido4Linhas}`;

      (mockOpenAI.chat.completions.create as any).mockResolvedValueOnce(
        makeChatResponse(modelContent),
      );

      const result = await service.summarize('texto');

      expect(result.solicitacaoPedido.split('\n')).toHaveLength(3);
    });

    it('deve retornar o conteúdo completo como teseJuridica quando o formato não for reconhecido', async () => {
      const unexpectedContent = 'Resposta fora do formato esperado.';
      (mockOpenAI.chat.completions.create as any).mockResolvedValueOnce(
        makeChatResponse(unexpectedContent),
      );

      const result = await service.summarize('texto');

      expect(result.teseJuridica).toBe(unexpectedContent);
      expect(result.solicitacaoPedido).toBe('');
    });

    it('deve lançar erro quando a chamada para OpenAI falhar', async () => {
      (mockOpenAI.chat.completions.create as any).mockRejectedValueOnce(
        new Error('OpenAI API Error'),
      );

      await expect(service.summarize('texto')).rejects.toThrow('OpenAI API Error');
    });
  });
});
