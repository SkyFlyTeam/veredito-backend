import { Test } from '@nestjs/testing';
import { PeticaoModule } from '../../src/peticao/peticao.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PeticaoEntity } from '../../src/peticao/entity/peticao.entity';
import { describe, expect, it } from '@jest/globals';

describe('PeticaoModule', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      imports: [PeticaoModule],
    })
      .overrideProvider(getRepositoryToken(PeticaoEntity))
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });
});
