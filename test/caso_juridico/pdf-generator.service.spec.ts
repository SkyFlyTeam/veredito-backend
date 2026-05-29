import { describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PdfGeneratorService, SecaoPeticao, CasoInfoPdf } from '../../src/caso_juridico/service/pdf-generator.service';

describe('PdfGeneratorService', () => {
  let service: PdfGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfGeneratorService],
    }).compile();

    service = module.get<PdfGeneratorService>(PdfGeneratorService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve gerar um PDF em formato Buffer com sucesso', async () => {
    const secoes: SecaoPeticao[] = [
      { titulo: 'DOS FATOS', conteudo: 'Fatos simulados para o teste.' },
      { titulo: 'DOS PEDIDOS', conteudo: 'Pedidos simulados para o teste.' },
    ];

    const casoInfo: CasoInfoPdf = {
      uf: 'sp',
      area_direito: 'Civil',
      tese_pretendida: 'Cobrança Indevida',
    };

    const pdfBuffer = await service.gerarPeticaoPdf(secoes, casoInfo);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('deve gerar um PDF mesmo sem as informações opcionais do caso', async () => {
    const secoes: SecaoPeticao[] = [
      { titulo: 'DOS FATOS', conteudo: 'Fatos sem info de caso.' },
    ];

    const pdfBuffer = await service.gerarPeticaoPdf(secoes);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
