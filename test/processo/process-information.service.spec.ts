import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcessInformationService } from '../../src/processo/service/process-information.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

jest.mock('openai');

const mockFatos =
  'A parte autora, pessoa física, firmou contrato de prestação de serviços com a ré em janeiro de 2023.\n' +
  'Durante a execução do contrato, surgiram divergências quanto à qualidade dos serviços prestados.\n' +
  'A ré deixou de efetuar os pagamentos acordados a partir do mês de março de 2023, acumulando débitos.\n' +
  'Notificada extrajudicialmente, a ré não apresentou qualquer resposta ou regularização dos valores devidos.\n' +
  'Diante da inércia da parte contrária, o autor viu-se compelido a ingressar com a presente ação judicial.';

const mockPedidos =
  'O autor requer a condenação da ré ao pagamento dos valores inadimplidos, devidamente corrigidos.\n' +
  'Requer ainda a incidência de juros moratórios legais desde a data do vencimento de cada parcela devida.\n' +
  'Pugna pela aplicação de multa contratual prevista na cláusula décima do instrumento firmado entre as partes.\n' +
  'Requer a condenação da ré ao pagamento de danos morais pela conduta omissiva e negligente apresentada.\n' +
  'Por fim, requer a condenação nos ônus de sucumbência, incluindo honorários advocatícios.';

const mockFundamentos =
  'O pedido encontra fundamento no artigo 389 do Código Civil, que trata do inadimplemento das obrigações.\n' +
  'Aplicam-se ainda os artigos 395 e 396 do Código Civil, relativos à mora e seus efeitos jurídicos.\n' +
  'A responsabilidade civil da ré decorre do artigo 927 do Código Civil e do princípio da boa-fé objetiva.\n' +
  'O dano moral restou configurado nos termos da jurisprudência consolidada do Superior Tribunal de Justiça.\n' +
  'A fixação dos honorários advocatícios segue o artigo 85 do Código de Processo Civil.';

describe('ProcessInformationService', () => {
  let service: ProcessInformationService;
  let openaiMock: any;

  beforeEach(async () => {
    openaiMock = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    fatos: mockFatos,
                    pedidos: mockPedidos,
                    fundamentosJuridicos: mockFundamentos,
                  }),
                },
              },
            ],
          }),
        },
      },
    };

    (OpenAI as unknown as jest.Mock).mockImplementation(() => openaiMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessInformationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<ProcessInformationService>(ProcessInformationService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve retornar ProcessInformation com os três campos preenchidos', async () => {
    const result = await service.extractInformation({
      peticao: 'Texto da petição inicial do processo.',
    });

    expect(result).toHaveProperty('fatos');
    expect(result).toHaveProperty('pedidos');
    expect(result).toHaveProperty('fundamentosJuridicos');
  });

  it('deve retornar fatos com no mínimo 1 parágrafo (~5 linhas)', async () => {
    const result = await service.extractInformation({
      peticao: 'Texto da petição inicial do processo.',
    });

    const linhas = result.fatos.split('\n').filter((l) => l.trim().length > 0);
    expect(linhas.length).toBeGreaterThanOrEqual(5);
  });

  it('deve retornar pedidos com no mínimo 1 parágrafo (~5 linhas)', async () => {
    const result = await service.extractInformation({
      peticao: 'Texto da petição inicial do processo.',
    });

    const linhas = result.pedidos.split('\n').filter((l) => l.trim().length > 0);
    expect(linhas.length).toBeGreaterThanOrEqual(5);
  });

  it('deve retornar fundamentosJuridicos com no mínimo 1 parágrafo (~5 linhas)', async () => {
    const result = await service.extractInformation({
      peticao: 'Texto da petição inicial do processo.',
    });

    const linhas = result.fundamentosJuridicos
      .split('\n')
      .filter((l) => l.trim().length > 0);
    expect(linhas.length).toBeGreaterThanOrEqual(5);
  });

  it('deve aceitar peças opcionais além da petição', async () => {
    const result = await service.extractInformation({
      peticao: 'Texto da petição.',
      constentacao: 'Texto da contestação.',
      sentenca: 'Texto da sentença.',
      recurso: 'Texto do recurso.',
    });

    expect(result.fatos.length).toBeGreaterThan(0);
    expect(result.pedidos.length).toBeGreaterThan(0);
    expect(result.fundamentosJuridicos.length).toBeGreaterThan(0);
  });

  it('deve lidar com erros da OpenAI retornando mensagens de fallback', async () => {
    openaiMock.chat.completions.create.mockRejectedValue(
      new Error('OpenAI connection error'),
    );

    const result = await service.extractInformation({
      peticao: 'Texto da petição.',
    });

    expect(result.fatos).toBe(
      'Não foi possível extrair os fatos processuais no momento.',
    );
    expect(result.pedidos).toBe(
      'Não foi possível extrair os pedidos processuais no momento.',
    );
    expect(result.fundamentosJuridicos).toBe(
      'Não foi possível extrair os fundamentos jurídicos no momento.',
    );
  });
});
