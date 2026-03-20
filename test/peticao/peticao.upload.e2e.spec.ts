import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PeticaoModule } from '../../src/peticao/peticao.module';
import { PeticaoService } from '../../src/peticao/service/peticao.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PeticaoEntity } from '../../src/peticao/entity/peticao.entity';
import { describe, expect, it, jest, afterAll, beforeEach } from '@jest/globals';
import { existsSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';

describe('Peticao Upload (e2e)', () => {
  let app: INestApplication;
  const uploadDir = './uploads/peticoes/';

  const mockPeticaoService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    if (existsSync(uploadDir)) {
      rmdirSync(uploadDir, { recursive: true });
    }

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
    if (existsSync(uploadDir)) {
    }
  });

  it('/peticoes/upload (POST) - Success with PDF', async () => {
    const response = await request(app.getHttpServer())
      .post('/peticoes/upload')
      .attach('file', Buffer.from('fake pdf content'), 'test.pdf')
      .expect(201);

    expect(mockPeticaoService.create).toHaveBeenCalled();
    expect(existsSync(uploadDir)).toBe(true);
  });

  it('/peticoes/upload (POST) - Success with DOCX', async () => {
    await request(app.getHttpServer())
      .post('/peticoes/upload')
      .attach('file', Buffer.from('fake docx content'), 'test.docx')
      .expect(201);
  });

  it('/peticoes/upload (POST) - Failure with invalid extension', async () => {
    const response = await request(app.getHttpServer())
      .post('/peticoes/upload')
      .attach('file', Buffer.from('fake image content'), 'test.png')
      .expect(400);

    expect(response.body.message).toBe('Apenas arquivos .pdf, .docx e .txt são permitidos');
  });

  it('/peticoes/upload (POST) - Failure with no file', async () => {
    const response = await request(app.getHttpServer())
      .post('/peticoes/upload')
      .expect(400);

    expect(response.body.message).toBe('Arquivo é obrigatório');
  });
});
