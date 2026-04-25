/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
jest.setTimeout(60000);

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PipelineOrchestrator } from '../../src/peticao/pipeline-services/pipeline_orchestror';
import { PeticaoEntity } from '../../src/peticao/entity/peticao.entity';
import { PrecedenteSugeridoEntity } from '../../src/precedents/entity/precedente_sugerido.entity';

import { WordProcessingService } from '../../src/peticao/pipeline-services/word_processing/word-processing.service';
import { EmbeddingsService } from '../../src/embeddings/embeddings.service';
import { SemanticSearchService } from '../../src/peticao/semantic-search/service/semantic-search.service';
import { PrecedenteSugeridoService } from '../../src/precedents/service/precedente_sugerido.service';
import { UserEntity } from '../../src/account/user/entity/user.entity';
import PrecedenteEntity from '../../src/precedents/entity/precedente.entity';
import { TextProcessingService } from '../../src/peticao/pipeline-services/word_processing/text-processing.service';
import { SummaryService } from '../../src/peticao/pipeline-services/summary/summary.service';
import { ResumeService } from '../../src/peticao/pipeline-services/resume/resume.service';
import { SynthesisService } from '../../src/synthesis/synthesis.service';

function collectEvents(observable: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const events: any[] = [];

    observable.subscribe({
      next: (event: any) => events.push(event),
      error: reject,
      complete: () => resolve(events),
    });
  });
}

describe('PipelineOrchestrator (Integration)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  let orchestrator: PipelineOrchestrator;
  let peticaoRepository: Repository<PeticaoEntity>;
  let precedenteSugeridoRepository: Repository<PrecedenteSugeridoEntity>;
  let precedenteRepository: Repository<PrecedenteEntity>;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          PeticaoEntity,
          PrecedenteSugeridoEntity,
          PrecedenteEntity,
          UserEntity,
        ]),
      ],
      providers: [
        PipelineOrchestrator,
        WordProcessingService,
        TextProcessingService,
        SemanticSearchService,
        PrecedenteSugeridoService,
        SummaryService,
        ResumeService,
        {
          provide: EmbeddingsService,
          useValue: {
            generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
          },
        },
        {
          provide: SynthesisService,
          useValue: {
            generateSynthesis: jest.fn().mockResolvedValue({
              classificacao: 1,
              sintese: 'Test synthesis',
            }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    orchestrator = moduleRef.get(PipelineOrchestrator);
    peticaoRepository = moduleRef.get(getRepositoryToken(PeticaoEntity));
    precedenteSugeridoRepository = moduleRef.get(
      getRepositoryToken(PrecedenteSugeridoEntity),
    );
    precedenteRepository = moduleRef.get(getRepositoryToken(PrecedenteEntity));
    userRepository = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await precedenteSugeridoRepository.createQueryBuilder().delete().execute();
    await peticaoRepository.createQueryBuilder().delete().execute();
    await precedenteRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
  });

  it('deve executar o pipeline completo integrando banco + services', async () => {
    const user = await userRepository.save({
      nome: 'Teste',
      sobrenome: 'User',
      email: 'teste@teste.com',
      password: Buffer.from('123456'),
    });

    const precedent = await precedenteRepository.save({
      numero_registro: 'ABC123',
      tese: 'tese integração',
      questao: 'questao integração',
      ultima_atualizacao: new Date(),
    });

    const peticao = await peticaoRepository.save({
      caminhoArquivo: 'fake-path.docx',
      resumo: null,
      teseVetor: null,
      questaoVetor: null,
      user,
    });

    const resumoGerado =
      'TESE JURÍDICA:\nTese jurídica de teste\n\nSOLICITAÇÃO/PEDIDO:\nPedido de teste';

    const wordService = moduleRef.get(WordProcessingService);
    jest
      .spyOn(wordService, 'extractTextFromPath')
      .mockResolvedValue('texto bruto de teste integração');

    const summaryService = moduleRef.get(SummaryService);
    jest.spyOn(summaryService, 'summarize').mockResolvedValue({
      teseJuridica: 'Tese jurídica de teste',
      solicitacaoPedido: 'Pedido de teste',
    });

    const resumeService = moduleRef.get(ResumeService);
    jest.spyOn(resumeService, 'saveResume').mockResolvedValue({
      ...peticao,
      resumo: resumoGerado,
    } as any);

    const semanticService = moduleRef.get(SemanticSearchService);
    jest.spyOn(semanticService, 'searchSimilar').mockResolvedValue([
      {
        id: precedent.id,
        numero_registro: precedent.numero_registro,
        tese: precedent.tese,
        questao: precedent.questao,
        score: 0.1,
      },
    ]);

    const events = await collectEvents(orchestrator.run(peticao.id));

    expect(events.length).toBeGreaterThan(0);

    const resumeEvent = events.find((e) => e.stage === 'resumo');
    const searchEvent = events.find((e) => e.stage === 'search');
    const synthesisEvent = events.find((e) => e.stage === 'synthesis');
    const completeEvent = events.find((e) => e.stage === 'complete');

    expect(resumeEvent).toBeDefined();
    expect(resumeEvent.status).toBe('success');
    expect(resumeEvent.data.resumo).toBe(resumoGerado);

    expect(searchEvent).toBeDefined();
    expect(searchEvent.status).toBe('success');
    expect(searchEvent.data.totalFound).toBe(1);

    expect(synthesisEvent).toBeDefined();
    expect(synthesisEvent.status).toBe('success');

    expect(completeEvent).toBeDefined();
    expect(completeEvent.status).toBe('success');
    expect(completeEvent.data.precedentsProcessed).toBe(1);
    expect(completeEvent.data.synthesisGenerated).toBe(1);

    const updatedPeticao = await peticaoRepository.findOne({
      where: { id: peticao.id },
      select: ['id', 'teseVetor', 'questaoVetor', 'resumo'] as any,
    });

    expect(updatedPeticao).toBeDefined();
    expect(updatedPeticao!.teseVetor).toBeTruthy();
    expect(updatedPeticao!.questaoVetor).toBeTruthy();

    const precedentesSalvos = await precedenteSugeridoRepository.find({
      where: { peticao: { id: peticao.id } },
      relations: ['peticao'],
    });

    expect(precedentesSalvos.length).toBeGreaterThanOrEqual(1);

    expect(precedentesSalvos[0]).toMatchObject({
      precedenteId: precedent.id,
      classificacao: 1,
    });
  });
});
