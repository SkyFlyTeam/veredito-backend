/**
 * 
 * 
 *
 * use:
 *   npx jest test/integration/process-information.integration.spec.ts --no-coverage
 *
 * 
 */

jest.setTimeout(60000);

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ProcessInformationService } from '../../src/processo/service/process-information.service';
import { ProcessPieces } from '../../src/processo/types/process-pieces.type';
import { ProcessInformation } from '../../src/processo/types/process-information.type';

const hasApiKey = !!process.env.OPENAI_API_KEY;
const describeIfKey = hasApiKey ? describe : describe.skip;

const PETICAO_EXEMPLO = `
EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA VARA CÍVEL DA COMARCA DE SÃO PAULO

JOÃO DA SILVA, brasileiro, solteiro, empresário, portador do RG nº 12.345.678-9 e CPF nº 123.456.789-00,
residente e domiciliado na Rua das Flores, nº 100, Bairro Jardim, São Paulo/SP, CEP 01001-000,
por meio de seu advogado subscritor, vem respeitosamente à presença de Vossa Excelência,
com fundamento nos artigos 319 e seguintes do Código de Processo Civil e nos artigos 389, 395 e 927 do
Código Civil Brasileiro, propor a presente

AÇÃO DE COBRANÇA COM PEDIDO DE DANOS MORAIS

em face de EMPRESA XYZ LTDA., pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 00.000.000/0001-00,
com sede na Avenida Central, nº 500, Bairro Centro, São Paulo/SP, CEP 01002-000, pelos fatos e fundamentos
a seguir expostos:

I - DOS FATOS

O autor celebrou contrato de prestação de serviços de consultoria empresarial com a ré em 01 de janeiro de 2023,
pelo prazo de 12 (doze) meses, com remuneração mensal de R$ 5.000,00 (cinco mil reais), a ser paga até o
5º (quinto) dia útil de cada mês subsequente ao da prestação dos serviços.

Durante os meses de janeiro e fevereiro de 2023, o autor prestou todos os serviços contratados, conforme
relatórios mensais entregues e aceitos pela ré sem qualquer ressalva.

Ocorre que a ré, a partir do vencimento das parcelas de fevereiro e março de 2023, deixou de efetuar os
pagamentos devidos, totalizando o débito de R$ 10.000,00 (dez mil reais), sem qualquer justificativa plausível.

Notificado extrajudicialmente em 10 de abril de 2023, com prazo de 15 dias para pagamento, a ré quedou-se
inerte, descumprindo as obrigações contratualmente assumidas e causando prejuízos materiais e morais ao autor.

II - DO DIREITO

O inadimplemento contratual da ré viola o disposto no artigo 389 do Código Civil, que determina a obrigação
de indenizar os prejuízos causados pelo descumprimento contratual. Os juros moratórios são devidos desde o
vencimento de cada parcela, nos termos do artigo 395 do mesmo diploma legal.

A conduta omissiva e negligente da ré, ao deixar de adimplir obrigação contratual líquida, certa e exigível,
configura ato ilícito apto a gerar responsabilidade civil, na forma do artigo 927 do Código Civil.

III - DOS PEDIDOS

Ante o exposto, requer o autor a condenação da ré ao pagamento de:
a) R$ 10.000,00 (dez mil reais) referentes às parcelas em aberto, corrigidas pelo IGPM;
b) Juros moratórios de 1% ao mês desde o vencimento de cada parcela;
c) Danos morais em valor a ser arbitrado pelo juízo, não inferior a R$ 5.000,00;
d) Honorários advocatícios e custas processuais.

Dá-se à causa o valor de R$ 15.000,00 (quinze mil reais).

Nestes termos, pede deferimento.

São Paulo, 22 de maio de 2023.

Dr. José Santos - OAB/SP 99.999
`;

function countNonEmptyLines(text: string): number {
  return text.split('\n').filter((l) => l.trim().length > 0).length;
}

function countParagraphs(text: string): number {
  return text.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
}

describeIfKey('ProcessInformationService (Integração Real com OpenAI)', () => {
  let service: ProcessInformationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [ProcessInformationService],
    }).compile();

    service = module.get<ProcessInformationService>(ProcessInformationService);
  });

  it('deve extrair informações reais de uma petição inicial', async () => {
    const pieces: ProcessPieces = {
      peticao: PETICAO_EXEMPLO,
    };

    const result: ProcessInformation = await service.extractInformation(pieces);

    console.log('\n========== FATOS ==========\n', result.fatos);
    console.log('\n========== PEDIDOS ==========\n', result.pedidos);
    console.log('\n========== FUNDAMENTOS JURÍDICOS ==========\n', result.fundamentosJuridicos);

    expect(result.fatos).toBeTruthy();
    expect(result.pedidos).toBeTruthy();
    expect(result.fundamentosJuridicos).toBeTruthy();

    // Valida por quantidade de caracteres: ~5 linhas x ~60 chars/linha = ~300 chars mínimo
    const MIN_CHARS = 300;
    expect(result.fatos.length).toBeGreaterThanOrEqual(MIN_CHARS);
    expect(result.pedidos.length).toBeGreaterThanOrEqual(MIN_CHARS);
    expect(result.fundamentosJuridicos.length).toBeGreaterThanOrEqual(MIN_CHARS);

    const fatosParagrafos = countParagraphs(result.fatos);
    const pedidosParagrafos = countParagraphs(result.pedidos);
    const fundamentosParagrafos = countParagraphs(result.fundamentosJuridicos);

    console.log(`Chars — fatos: ${result.fatos.length}, pedidos: ${result.pedidos.length}, fundamentos: ${result.fundamentosJuridicos.length}`);
    console.log(`Parágrafos — fatos: ${fatosParagrafos}, pedidos: ${pedidosParagrafos}, fundamentos: ${fundamentosParagrafos}`);

    expect(fatosParagrafos).toBeLessThanOrEqual(5);
    expect(pedidosParagrafos).toBeLessThanOrEqual(5);
    expect(fundamentosParagrafos).toBeLessThanOrEqual(5);
  });

  it('não deve retornar mensagem de fallback quando a API key é válida', async () => {
    const pieces: ProcessPieces = { peticao: PETICAO_EXEMPLO };

    const result = await service.extractInformation(pieces);

    expect(result.fatos).not.toBe('Não foi possível extrair os fatos processuais no momento.');
    expect(result.pedidos).not.toBe('Não foi possível extrair os pedidos processuais no momento.');
    expect(result.fundamentosJuridicos).not.toBe('Não foi possível extrair os fundamentos jurídicos no momento.');
  });
});
