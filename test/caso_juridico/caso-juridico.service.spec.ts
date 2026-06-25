import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { CasoJuridicoService } from '../../src/caso_juridico/service/caso-juridico.service';
import { CasoJuridicoEntity } from '../../src/caso_juridico/entity/caso_juridico.entity';
import { SecoesPeticaoEntity } from '../../src/caso_juridico/entity/secoes_peticao.entity';
import { CasoPrecedenteSugeridoEntity } from '../../src/caso_juridico/entity/caso_precedente_sugerido.entity';

jest.mock('openai');

describe('CasoJuridicoService', () => {
  let service: CasoJuridicoService;
  let casoRepositoryMock: jest.Mocked<Repository<CasoJuridicoEntity>>;
  let secoesPeticaoRepositoryMock: jest.Mocked<Repository<SecoesPeticaoEntity>>;
  let casoPrecedenteSugeridoRepositoryMock: jest.Mocked<Repository<CasoPrecedenteSugeridoEntity>>;
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
                    secoes: [
                      {
                        titulo: 'DOS FATOS',
                        conteudo: 'Conteúdo da petição gerado pelo modelo.',
                      },
                      {
                        titulo: 'DOS PEDIDOS',
                        conteudo: 'Conteúdo dos pedidos.',
                      }
                    ]
                  }),
                },
              },
            ],
          }),
        },
      },
    };

    (OpenAI as unknown as jest.Mock).mockImplementation(() => openaiMock);

    casoRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    secoesPeticaoRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    } as any;

    casoPrecedenteSugeridoRepositoryMock = {
      find: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasoJuridicoService,
        {
          provide: getRepositoryToken(CasoJuridicoEntity),
          useValue: casoRepositoryMock,
        },
        {
          provide: getRepositoryToken(SecoesPeticaoEntity),
          useValue: secoesPeticaoRepositoryMock,
        },
        {
          provide: getRepositoryToken(CasoPrecedenteSugeridoEntity),
          useValue: casoPrecedenteSugeridoRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<CasoJuridicoService>(CasoJuridicoService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve gerar petição inicial com sucesso', async () => {
    const mockCaso = {
      id: 1,
      area_direito: 'Civil',
      pedidos_principais: 'Danos Morais',
      tese_pretendida: 'Enriquecimento sem causa',
      uf: 'SP',
      fundamentos_juridicos: 'Art 186 CC',
      fatos_estruturados: 'O autor comprou um produto com defeito.',
    } as CasoJuridicoEntity;

    casoRepositoryMock.findOne.mockResolvedValueOnce(mockCaso);

    const mockSecoes = [
      {
        id: 10,
        titulo: 'DOS FATOS',
        conteudo: 'Conteúdo da petição gerado pelo modelo.',
        casoJuridicoId: 1,
      },
      {
        id: 11,
        titulo: 'DOS PEDIDOS',
        conteudo: 'Conteúdo dos pedidos.',
        casoJuridicoId: 1,
      }
    ] as SecoesPeticaoEntity[];

    secoesPeticaoRepositoryMock.delete.mockResolvedValueOnce({ affected: 2 } as any);
    secoesPeticaoRepositoryMock.create
      .mockReturnValueOnce(mockSecoes[0])
      .mockReturnValueOnce(mockSecoes[1]);
    secoesPeticaoRepositoryMock.save.mockResolvedValueOnce(mockSecoes as any);

    const result = await service.gerarPeticaoInicial(1);

    expect(casoRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['secoesPeticao'],
    });
    expect(openaiMock.chat.completions.create).toHaveBeenCalled();
    const promptChamada = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0] as any;
    expect(promptChamada.messages[1].content).toContain('Área do Direito: Civil');
    expect(promptChamada.messages[1].content).toContain('--- EXEMPLO 1 (Caso com tutela de urgência e direito específico) ---');

    expect(secoesPeticaoRepositoryMock.delete).toHaveBeenCalledWith({ casoJuridicoId: 1 });
    expect(secoesPeticaoRepositoryMock.create).toHaveBeenNthCalledWith(1, {
      titulo: 'DOS FATOS',
      conteudo: 'Conteúdo da petição gerado pelo modelo.',
      casoJuridicoId: 1,
    });
    expect(secoesPeticaoRepositoryMock.create).toHaveBeenNthCalledWith(2, {
      titulo: 'DOS PEDIDOS',
      conteudo: 'Conteúdo dos pedidos.',
      casoJuridicoId: 1,
    });
    expect(secoesPeticaoRepositoryMock.save).toHaveBeenCalledWith(mockSecoes);
    expect(result).toBe(mockSecoes);
  });

  it('deve lançar NotFoundException se o caso não existir', async () => {
    casoRepositoryMock.findOne.mockResolvedValueOnce(null);

    await expect(service.gerarPeticaoInicial(999))
      .rejects.toThrow(NotFoundException);

    expect(openaiMock.chat.completions.create).not.toHaveBeenCalled();
  });

  it('deve propagar erro se a chamada para OpenAI falhar', async () => {
    const mockCaso = {
      id: 1,
      area_direito: 'Civil',
      pedidos_principais: 'Danos Morais',
      tese_pretendida: 'Enriquecimento sem causa',
      uf: 'SP',
    } as CasoJuridicoEntity;

    casoRepositoryMock.findOne.mockResolvedValueOnce(mockCaso);
    openaiMock.chat.completions.create.mockRejectedValueOnce(new Error('OpenAI Call Failure'));

    await expect(service.gerarPeticaoInicial(1))
      .rejects.toThrow('OpenAI Call Failure');
  });
});
