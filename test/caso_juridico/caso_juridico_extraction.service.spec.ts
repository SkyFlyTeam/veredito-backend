import { CasoJuridicoExtractionService } from '../../src/caso_juridico/service/caso-juridico-extraction.service';
import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeMockFile = (originalname: string): any => ({
  originalname,
  buffer: Buffer.from('conteúdo de teste'),
  mimetype: 'application/pdf',
  size: 100,
});

// snake_case — igual ao que o service espera no parseAndValidate
const GPT_VALID_RESPONSE = JSON.stringify({
  fatos_estruturados:
    'O requerente firmou contrato de prestação de serviços com a requerida em 10 de janeiro de 2024, ' +
    'conforme instrumento particular acostado aos autos. A parte requerida deixou de cumprir as obrigações ' +
    'contratuais pactuadas, especialmente o pagamento das parcelas mensais acordadas. Em razão do inadimplemento, ' +
    'o requerente notificou extrajudicialmente a requerida em 15 de março de 2024, sem que houvesse resposta ' +
    'ou providência por parte desta. Diante da omissão, restou configurado o dano material suportado pelo autor.',
  fundamentos_juridicos:
    'O presente caso encontra amparo no artigo 186 do Código Civil Brasileiro, que estabelece a ' +
    'responsabilidade civil por ato ilícito. Aplica-se ainda o artigo 389 do mesmo diploma legal, ' +
    'que trata do inadimplemento das obrigações contratuais e suas consequências jurídicas. ' +
    'O Código de Defesa do Consumidor, em seu artigo 14, também incide na hipótese, uma vez que ' +
    'a relação entre as partes configura relação de consumo. Por fim, o artigo 927 do Código Civil ' +
    'reforça a obrigação de reparar o dano causado por ato ilícito.',
});

// ── Factories de mock ─────────────────────────────────────────────────────────

const createConfigServiceMock = () => ({
  get: jest.fn().mockReturnValue('fake-openai-api-key'),
});

const createOpenAiMock = () => ({
  files: {
    create: jest.fn(),
    del: jest.fn().mockResolvedValue({}),
  },
  responses: {
    create: jest.fn(),
  },
});

// ── Suite principal ───────────────────────────────────────────────────────────

describe('CasoJuridicoExtractionService', () => {
  let service: CasoJuridicoExtractionService;
  let openaiMock: ReturnType<typeof createOpenAiMock>;

  beforeEach(() => {
    jest.resetAllMocks();

    const configService = createConfigServiceMock();
    openaiMock = createOpenAiMock();

    service = new CasoJuridicoExtractionService(configService as any);
    (service as any).openai = openaiMock;

    // Default: upload e resposta válidos
    openaiMock.files.create.mockResolvedValue({ id: 'file-123' });
    openaiMock.responses.create.mockResolvedValue({ output_text: GPT_VALID_RESPONSE });
  });

  // ── extractFromDocuments ──────────────────────────────────────────────────

  describe('extractFromDocuments', () => {
    it('deve lançar BadRequestException quando nenhum arquivo é enviado', async () => {
      await expect(service.extractFromDocuments([], 'contexto')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando files é null', async () => {
      await expect(service.extractFromDocuments(null as any, 'contexto')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar UnsupportedMediaTypeException quando upload ao OpenAI falha', async () => {
      openaiMock.files.create.mockRejectedValue(new Error('Upload falhou'));

      await expect(
        service.extractFromDocuments([makeMockFile('documento.pdf')], 'contexto'),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('deve ignorar arquivos sem buffer e processar os válidos', async () => {
      const bad = { originalname: 'bad.pdf' } as any;
      const good = makeMockFile('peticao.pdf');

      const result = await service.extractFromDocuments([bad, good], 'contexto');

      expect(result.fatos_estruturados).toBeTruthy();
      expect(openaiMock.files.create).toHaveBeenCalledTimes(1);
    });

    it('deve processar múltiplos arquivos e enviar todos ao OpenAI', async () => {
      openaiMock.files.create
        .mockResolvedValueOnce({ id: 'file-a' })
        .mockResolvedValueOnce({ id: 'file-b' })
        .mockResolvedValueOnce({ id: 'file-c' });

      const result = await service.extractFromDocuments([
        makeMockFile('contrato.pdf'),
        makeMockFile('procuracao.docx'),
        makeMockFile('peticao.txt'),
      ], 'contexto');

      expect(openaiMock.files.create).toHaveBeenCalledTimes(3);
      expect(result.fatos_estruturados).toBeTruthy();
      expect(result.fundamentos_juridicos).toBeTruthy();
    });

    it('deve retornar CasoJuridicoInformations com os campos corretos', async () => {
      const result = await service.extractFromDocuments([makeMockFile('contrato.pdf')], 'contexto');

      expect(result).toHaveProperty('fatos_estruturados');
      expect(result).toHaveProperty('fundamentos_juridicos');
      expect(typeof result.fatos_estruturados).toBe('string');
      expect(typeof result.fundamentos_juridicos).toBe('string');
      expect(result.fatos_estruturados.length).toBeGreaterThan(0);
      expect(result.fundamentos_juridicos.length).toBeGreaterThan(0);
    });

    it('deve enviar arquivos como input_file para o Responses API', async () => {
      await service.extractFromDocuments([makeMockFile('decisao_anterior.pdf')], 'contexto');

      const callArgs = openaiMock.responses.create.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o-mini');
      const userInput = callArgs.input.find((i: any) => i.role === 'user');
      expect(userInput.content.some((c: any) => c.type === 'input_file')).toBe(true);
    });

    it('deve deletar os arquivos do OpenAI após a extração', async () => {
      openaiMock.files.create
        .mockResolvedValueOnce({ id: 'file-a' })
        .mockResolvedValueOnce({ id: 'file-b' });

      await service.extractFromDocuments([
        makeMockFile('contrato.pdf'),
        makeMockFile('peticao.pdf'),
      ], 'contexto');

      expect(openaiMock.files.del).toHaveBeenCalledTimes(2);
      expect(openaiMock.files.del).toHaveBeenCalledWith('file-a');
      expect(openaiMock.files.del).toHaveBeenCalledWith('file-b');
    });
  });

  // ── parseAndValidate ──────────────────────────────────────────────────────

  describe('parseAndValidate — tratamento de resposta do GPT', () => {
    it('deve lançar erro quando o GPT retorna JSON sem fatosEstruturados', async () => {
      openaiMock.responses.create.mockResolvedValue({
        output_text: JSON.stringify({ fundamentos_juridicos: 'ok' }),
      });

      await expect(
        service.extractFromDocuments([makeMockFile('doc.pdf')], 'contexto'),
      ).rejects.toThrow('fatos_estruturados / fundamentos_juridicos');
    });

    it('deve lançar erro quando o GPT retorna JSON sem fundamentosJuridicos', async () => {
      openaiMock.responses.create.mockResolvedValue({
        output_text: JSON.stringify({ fatos_estruturados: 'ok' }),
      });

      await expect(
        service.extractFromDocuments([makeMockFile('doc.pdf')], 'contexto'),
      ).rejects.toThrow('fatos_estruturados / fundamentos_juridicos');
    });

    it('deve lançar erro quando o GPT retorna texto inválido (não-JSON)', async () => {
      openaiMock.responses.create.mockResolvedValue({
        output_text: 'Desculpe, não consigo processar isso.',
      });

      await expect(
        service.extractFromDocuments([makeMockFile('doc.pdf')], 'contexto'),
      ).rejects.toThrow('formato inválido');
    });

    it('deve remover blocos markdown antes de parsear o JSON', async () => {
      const withMarkdown = '```json\n' + GPT_VALID_RESPONSE + '\n```';
      openaiMock.responses.create.mockResolvedValue({ output_text: withMarkdown });

      const result = await service.extractFromDocuments([makeMockFile('doc.pdf')], 'contexto');
      expect(result.fatos_estruturados).toBeTruthy();
    });

    it('deve fazer trim nos campos retornados pelo GPT', async () => {
      openaiMock.responses.create.mockResolvedValue({
        output_text: JSON.stringify({
          fatos_estruturados: '   Fatos com espaços nas bordas.   ',
          fundamentos_juridicos: '\n\nFundamentos com quebras de linha.\n\n',
        }),
      });

      const result = await service.extractFromDocuments([makeMockFile('doc.pdf')], 'contexto');
      expect(result.fatos_estruturados).toBe('Fatos com espaços nas bordas.');
      expect(result.fundamentos_juridicos).toBe('Fundamentos com quebras de linha.');
    });
  });

  // ── Configuração da chamada ao GPT ────────────────────────────────────────

  describe('configuração da chamada ao GPT', () => {
    it('deve usar o modelo gpt-4o-mini', async () => {
      await service.extractFromDocuments([makeMockFile('doc.pdf')], 'contexto');
      const callArgs = openaiMock.responses.create.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o-mini');
    });

    it('deve usar text.format json_object', async () => {
      await service.extractFromDocuments([makeMockFile('doc.pdf')], 'contexto');
      const callArgs = openaiMock.responses.create.mock.calls[0][0];
      expect(callArgs.text).toEqual({ format: { type: 'json_object' } });
    });

    it('deve usar temperature 0.2 para respostas determinísticas', async () => {
      await service.extractFromDocuments([makeMockFile('doc.pdf')], 'contexto');
      const callArgs = openaiMock.responses.create.mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.2);
    });

    it('deve incluir o contexto_fatico_fundamentos no system prompt', async () => {
      const contexto = 'Cliente demitido sem verbas rescisórias';
      await service.extractFromDocuments([makeMockFile('doc.pdf')], contexto);

      const callArgs = openaiMock.responses.create.mock.calls[0][0];
      const systemInput = callArgs.input.find((i: any) => i.role === 'system');
      const systemText = systemInput.content.find((c: any) => c.type === 'input_text');
      expect(systemText.text).toContain(contexto);
    });
  });
});
