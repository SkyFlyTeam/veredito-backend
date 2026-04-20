import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SynthesisService } from '../../src/synthesis/synthesis.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

jest.mock('openai');

describe('SynthesisService', () => {
  let service: SynthesisService;
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
                    sintese: 'O precedente citado aplica-se ao caso concreto pois trata da mesma matéria fática.',
                    classificacao: 'Aplicável'
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
        SynthesisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<SynthesisService>(SynthesisService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve retornar classificação numérica 2 para "Aplicável"', async () => {
    const result = await service.generateSynthesis('peticao', 'precedente');
    expect(result.classificacao).toBe(2);
  });

  it('deve retornar classificação numérica 1 para "Possivelmente aplicável"', async () => {
    openaiMock.chat.completions.create.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ sintese: '...', classificacao: 'Possivelmente aplicável' }) } }]
    });

    const result = await service.generateSynthesis('p', 'pre');
    expect(result.classificacao).toBe(1);
  });

  it('deve retornar classificação numérica 0 para "Não aplicável"', async () => {
    openaiMock.chat.completions.create.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ sintese: '...', classificacao: 'Não aplicável' }) } }]
    });

    const result = await service.generateSynthesis('p', 'pre');
    expect(result.classificacao).toBe(0);
  });

  it('deve lidar com erros graciosamente retornando fallback 1', async () => {
    openaiMock.chat.completions.create.mockRejectedValue(new Error('OpenAI Error'));

    const result = await service.generateSynthesis('peticao', 'precedente');

    expect(result.sintese).toBe('Não foi possível gerar a síntese explicativa no momento.');
    expect(result.classificacao).toBe(1);
  });
});
