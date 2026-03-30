jest.setTimeout(30000);

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

describe('PipelineOrchestrator (Integration)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  let orchestrator: PipelineOrchestrator;
  let peticaoRepository: Repository<PeticaoEntity>;
  let precedenteRepository: Repository<PrecedenteSugeridoEntity>;
  let userRepository: Repository<UserEntity>;

  beforeAll(async () => {
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
          synchronize: false,
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
        SemanticSearchService,
        PrecedenteSugeridoService,
        {
          provide: EmbeddingsService,
          useValue: {
            generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    orchestrator = moduleRef.get(PipelineOrchestrator);
    peticaoRepository = moduleRef.get(getRepositoryToken(PeticaoEntity));
    precedenteRepository = moduleRef.get(getRepositoryToken(PrecedenteSugeridoEntity));
    userRepository = moduleRef.get(getRepositoryToken(UserEntity));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await precedenteRepository.createQueryBuilder().delete().execute();
    await peticaoRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
  });

  it('deve executar o pipeline completo integrando banco + services', async () => {
    const user = await userRepository.save({
      nome: 'Teste',
      sobrenome: 'User',
      email: 'teste@teste.com',
      password: Buffer.from('123456'),
    });

    const peticao = await peticaoRepository.save({
      caminhoArquivo: 'fake-path.docx',
      resumo: null,
      teseVetor: null,
      questaoVetor: null,
      user: user,
    });

    const wordService = moduleRef.get(WordProcessingService);
    jest.spyOn(wordService, 'extractTextFromPath').mockResolvedValue(
      'texto bruto de teste integração',
    );

    const semanticService = moduleRef.get(SemanticSearchService);
    jest.spyOn(semanticService, 'searchSimilar').mockResolvedValue([
      {
        id: 100,
        numero_registro: 'ABC123',
        tese: 'tese integração',
        questao: 'questao integração',
        score: 0.1,
      },
    ]);

    const result = await orchestrator.run(peticao.id);

    expect(result.peticaoId).toBe(peticao.id);
    expect(result.precedentes.length).toBe(1);

    const updatedPeticao = await peticaoRepository.findOne({
      where: { id: peticao.id },
    });

    expect(updatedPeticao).toBeDefined();
    expect(updatedPeticao!.teseVetor).toBeTruthy();
    expect(updatedPeticao!.questaoVetor).toBeTruthy();

    const precedentesSalvos = await precedenteRepository.find({
      where: { peticao: { id: peticao.id } },
      relations: ['peticao'],
    });

    expect(precedentesSalvos.length).toBe(1);

    expect(precedentesSalvos[0]).toMatchObject({
      precedenteId: 100,
      classificacao: 1,
      percentual_similaridade: "90.00",
    });
  });
});