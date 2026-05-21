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

jest.mock('openai');

describe('CasoJuridicoService', () => {
  let service: CasoJuridicoService;
  let casoRepositoryMock: jest.Mocked<Repository<CasoJuridicoEntity>>;
  let secoesPeticaoRepositoryMock: jest.Mocked<Repository<SecoesPeticaoEntity>>;
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
                    titulo: 'Petição Inicial de Teste',
                    conteudo: 'Conteúdo da petição gerado pelo modelo.',
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

    const mockSecao = {
      id: 10,
      titulo: 'Petição Inicial de Teste',
      conteudo: 'Conteúdo da petição gerado pelo modelo.',
    } as SecoesPeticaoEntity;

    secoesPeticaoRepositoryMock.create.mockReturnValueOnce(mockSecao);
    secoesPeticaoRepositoryMock.save.mockResolvedValueOnce(mockSecao);
    casoRepositoryMock.save.mockResolvedValueOnce(mockCaso);

    const result = await service.gerarPeticaoInicial(1);

    expect(casoRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['secoesPeticao'],
    });
    expect(openaiMock.chat.completions.create).toHaveBeenCalled();
    const promptChamada = (openaiMock.chat.completions.create as jest.Mock).mock.calls[0][0] as any;
    expect(promptChamada.messages[1].content).toContain('Área do Direito: Civil');
    expect(promptChamada.messages[1].content).toContain('--- EXEMPLO 1 ---');

    expect(secoesPeticaoRepositoryMock.create).toHaveBeenCalledWith({
      titulo: 'Petição Inicial de Teste',
      conteudo: 'Conteúdo da petição gerado pelo modelo.',
    });
    expect(secoesPeticaoRepositoryMock.save).toHaveBeenCalledWith(mockSecao);
    expect(casoRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ secoesPeticao: mockSecao }),
    );
    expect(result).toBe(mockSecao);
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
