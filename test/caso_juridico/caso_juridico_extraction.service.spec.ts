import { CasoJuridicoExtractionService } from '../../src/caso_juridico/service/caso-juridico-extraction.service';
import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cria um mock de arquivo Multer mínimo */
const makeMockFile = (originalname: string): any => ({
  originalname,
  buffer: Buffer.from('conteúdo de teste'),
  mimetype: 'application/pdf',
  size: 100,
});

/** Resposta GPT válida serializada */
const GPT_VALID_RESPONSE = JSON.stringify({
  fatosEstruturados:
    'O requerente firmou contrato de prestação de serviços com a requerida em 10 de janeiro de 2024, ' +
    'conforme instrumento particular acostado aos autos. A parte requerida deixou de cumprir as obrigações ' +
    'contratuais pactuadas, especialmente o pagamento das parcelas mensais acordadas. Em razão do inadimplemento, ' +
    'o requerente notificou extrajudicialmente a requerida em 15 de março de 2024, sem que houvesse resposta ' +
    'ou providência por parte desta. Diante da omissão, restou configurado o dano material suportado pelo autor.',
  fundamentosJuridicos:
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
    del: jest.fn(),
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

    // Inject mock OpenAI client
    (service as any).openai = openaiMock as any;
  });

  // ── extractFromDocuments ──────────────────────────────────────────────────

  describe('extractFromDocuments', () => {
    it('deve lançar BadRequestException quando nenhum arquivo é enviado', async () => {
      await expect(service.extractFromDocuments([], '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando files é null', async () => {
      await expect(service.extractFromDocuments(null as any, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar UnsupportedMediaTypeException quando upload ao OpenAI falha', async () => {
      openaiMock.files.create.mockRejectedValueOnce(
        new BadRequestException('Upload falhou'),
      );

      await expect(
        service.extractFromDocuments([makeMockFile('documento.pdf')], ''),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('deve ignorar arquivos sem buffer e processar os válidos', async () => {
      const bad = { originalname: 'bad.pdf' } as any;
      const good = makeMockFile('peticao.pdf');

      openaiMock.files.create.mockResolvedValue({ id: 'file-1' });
      openaiMock.responses.create.mockResolvedValue({ output_text: GPT_VALID_RESPONSE });

      const result = await service.extractFromDocuments([bad, good], '');

      expect(result.fatosEstruturados).toBeTruthy();
      expect(openaiMock.files.create).toHaveBeenCalledTimes(1);
      expect(openaiMock.responses.create).toHaveBeenCalledTimes(1);
    });

    it('deve processar múltiplos arquivos e enviar todos ao OpenAI', async () => {
      openaiMock.files.create
        .mockResolvedValueOnce({ id: 'file-a' })
        .mockResolvedValueOnce({ id: 'file-b' })
        .mockResolvedValueOnce({ id: 'file-c' });

      openaiMock.responses.create.mockResolvedValue({ output_text: GPT_VALID_RESPONSE });

      const result = await service.extractFromDocuments([
        makeMockFile('contrato.pdf'),
        makeMockFile('procuracao.docx'),
        makeMockFile('peticao.txt'),
      ], '');

      expect(openaiMock.files.create).toHaveBeenCalledTimes(3);
      expect(result.fatosEstruturados).toBeTruthy();
      expect(result.fundamentosJuridicos).toBeTruthy();
    });

    it('deve retornar CasoJuridicoInformations com os campos corretos', async () => {
      openaiMock.files.create.mockResolvedValue({ id: 'file-xyz' });
      openaiMock.responses.create.mockResolvedValue({ output_text: GPT_VALID_RESPONSE });

      const result = await service.extractFromDocuments([
        makeMockFile('contrato.pdf'),
      ], '');

      expect(result).toHaveProperty('fatosEstruturados');
      expect(result).toHaveProperty('fundamentosJuridicos');
      expect(typeof result.fatosEstruturados).toBe('string');
      expect(typeof result.fundamentosJuridicos).toBe('string');
      expect(result.fatosEstruturados.length).toBeGreaterThan(0);
      expect(result.fundamentosJuridicos.length).toBeGreaterThan(0);
    });

    it('deve enviar arquivos como input_file para o Responses API', async () => {
      openaiMock.files.create.mockResolvedValue({ id: 'file-123' });
      openaiMock.responses.create.mockResolvedValue({ output_text: GPT_VALID_RESPONSE });

      await service.extractFromDocuments([makeMockFile('decisao_anterior.pdf')], '');

      const responsesCallArgs = openaiMock.responses.create.mock.calls[0][0];
      // Ensure model was set and file input present
      expect(responsesCallArgs.model).toBe('gpt-4o-mini');
      const userInput = responsesCallArgs.input.find((i: any) => i.role === 'user');
      expect(userInput.content.some((c: any) => c.type === 'input_file')).toBe(true);
    });
  });

  // ── parseAndValidate (via callGpt) ────────────────────────────────────────

  describe('parseAndValidate — tratamento de resposta do GPT', () => {
    beforeEach(() => {
      openaiMock.files.create.mockResolvedValue({ id: 'file-one' });
    });

    it('deve lançar erro quando o GPT retorna JSON sem fatosEstruturados', async () => {
      openaiMock.responses.create.mockResolvedValue({ output_text: JSON.stringify({ fundamentosJuridicos: 'ok' }) });

      await expect(
        service.extractFromDocuments([makeMockFile('doc.pdf')], ''),
      ).rejects.toThrow('campos obrigatórios');
    });

    it('deve lançar erro quando o GPT retorna JSON sem fundamentosJuridicos', async () => {
      openaiMock.responses.create.mockResolvedValue({ output_text: JSON.stringify({ fatosEstruturados: 'ok' }) });

      await expect(
        service.extractFromDocuments([makeMockFile('doc.pdf')], ''),
      ).rejects.toThrow('campos obrigatórios');
    });

    it('deve lançar erro quando o GPT retorna texto inválido (não-JSON)', async () => {
      openaiMock.responses.create.mockResolvedValue({ output_text: 'Desculpe, não consigo processar isso.' });

      await expect(
        service.extractFromDocuments([makeMockFile('doc.pdf')], ''),
      ).rejects.toThrow('formato inválido');
    });

    it('deve remover blocos markdown antes de parsear o JSON', async () => {
      const withMarkdown = '```json\n' + GPT_VALID_RESPONSE + '\n```';

      openaiMock.responses.create.mockResolvedValue({ output_text: withMarkdown });

      const result = await service.extractFromDocuments([
        makeMockFile('doc.pdf'),
      ], '');
      expect(result.fatosEstruturados).toBeTruthy();
    });

    it('deve fazer trim nos campos retornados pelo GPT', async () => {
      openaiMock.responses.create.mockResolvedValue({ output_text: JSON.stringify({
        fatosEstruturados: '   Fatos com espaços nas bordas.   ',
        fundamentosJuridicos: '\n\nFundamentos com quebras de linha.\n\n',
      }) });

      const result = await service.extractFromDocuments([
        makeMockFile('doc.pdf'),
      ], '');
      expect(result.fatosEstruturados).toBe('Fatos com espaços nas bordas.');
      expect(result.fundamentosJuridicos).toBe('Fundamentos com quebras de linha.');
    });
  });

  // ── Configuração da chamada ao GPT ────────────────────────────────────────

  describe('configuração da chamada ao GPT', () => {
    beforeEach(() => {
      openaiMock.files.create.mockResolvedValue({ id: 'file-one' });
      openaiMock.responses.create.mockResolvedValue({ output_text: GPT_VALID_RESPONSE });
    });

    it('deve usar o modelo gpt-4o-mini', async () => {
      await service.extractFromDocuments([makeMockFile('doc.pdf')], '');

      const callArgs = openaiMock.responses.create.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o-mini');
    });

    it('deve usar text.format json_object', async () => {
      await service.extractFromDocuments([makeMockFile('doc.pdf')], '');

      const callArgs = openaiMock.responses.create.mock.calls[0][0];
      expect(callArgs.text).toEqual({ format: { type: 'json_object' } });
    });

    it('deve usar temperature 0.2 para respostas determinísticas', async () => {
      await service.extractFromDocuments([makeMockFile('doc.pdf')], '');

      const callArgs = openaiMock.responses.create.mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.2);
    });
  });
});
