import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PeticaoModule } from '../src/peticao/peticao.module';
import { PeticaoService } from '../src/peticao/service/peticao.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PeticaoEntity } from '../src/peticao/entity/peticao.entity';

describe('PeticaoController (e2e)', () => {
  let app: INestApplication;

  const mockPeticaoResponse = {
    id: 1,
    caminhoArquivo: 'path/to/file.pdf',
    resumo: 'Resumo da petição',
    createdAt: new Date().toISOString(),
    usuarioId: 1,
  };

  const mockPeticaoService = {
    findAll: jest.fn().mockResolvedValue([mockPeticaoResponse]),
    findOne: jest.fn().mockResolvedValue(mockPeticaoResponse),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PeticaoModule],
    })
      .overrideProvider(PeticaoService)
      .useValue(mockPeticaoService)
      .overrideProvider(getRepositoryToken(PeticaoEntity))
      .useValue(mockRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/peticao (GET)', () => {
    return request(app.getHttpServer())
      .get('/peticao')
      .expect(200)
      .expect([mockPeticaoResponse]);
  });

  it('/peticao/:id (GET) - Success', () => {
    return request(app.getHttpServer())
      .get('/peticao/1')
      .expect(200)
      .expect(mockPeticaoResponse);
  });

  it('/peticao/:id (GET) - Invalid ID (Pipe check)', () => {
    return request(app.getHttpServer())
      .get('/peticao/abc')
      .expect(400); // ParseIntPipe should return 400
  });
});
