import { Test } from '@nestjs/testing';
import { PeticaoModule } from './peticao.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PeticaoEntity } from './entity/peticao.entity';

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
