import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';

jest.mock('@nestjs/schedule', () => ({
  Cron: () => {
    return () => undefined;
  },
}), { virtual: true });

jest.mock('../../src/peticao/pipeline-services/word_processing/text-processing.service', () => ({
  TextProcessingService: class TextProcessingService {},
}));

import { PeticaoDeleteCronService } from '../../src/crons/jobs/peticao-delete.cron';

type RawPeticao = { id: number; caminhoArquivo?: string };

type QueryBuilderMock = {
  leftJoin: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  groupBy: jest.Mock;
  addGroupBy: jest.Mock;
  having: jest.Mock;
  getRawMany: jest.Mock;
};

const createQueryBuilderMock = (): QueryBuilderMock => {
  const qb = {
    leftJoin: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    addGroupBy: jest.fn(),
    having: jest.fn(),
    getRawMany: jest.fn(),
  } as QueryBuilderMock;

  qb.leftJoin.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  qb.addSelect.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.groupBy.mockReturnValue(qb);
  qb.addGroupBy.mockReturnValue(qb);
  qb.having.mockReturnValue(qb);

  return qb;
};

const createRepositoryMock = () => {
  const queryBuilder = createQueryBuilderMock();

  return {
    queryBuilder,
    createQueryBuilder: jest.fn((_: string) => queryBuilder),
  };
};

const createPeticaoServiceMock = () => ({
  deleteManyWithFiles: jest.fn((_: RawPeticao[]) =>
    Promise.resolve({ deleted: 0, fileDeleteFailures: 0 }),
  ),
});

describe('PeticaoDeleteCronService', () => {
  let service: PeticaoDeleteCronService;
  let repository: ReturnType<typeof createRepositoryMock>;
  let peticaoService: ReturnType<typeof createPeticaoServiceMock>;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = createRepositoryMock();
    peticaoService = createPeticaoServiceMock();
    service = new PeticaoDeleteCronService(
      repository as never,
      peticaoService as never,
    );
  });

  it('should log cron expression on module init', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      return undefined;
    });

    service.onModuleInit();

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Peticao cleanup cron registered with expression:'),
    );
  });

  it('should skip delete when no stale peticoes are found', async () => {
    (repository.queryBuilder.getRawMany as any).mockResolvedValueOnce([]);

    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      return undefined;
    });

    await service.handleCron();

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('peticao');
    expect(repository.queryBuilder.leftJoin).toHaveBeenCalledWith(
      'peticao.precedenteSugerido',
      'precedenteSugerido',
    );
    expect(repository.queryBuilder.where).toHaveBeenCalledWith(
      'peticao.createdAt <= :cutoffDate',
      { cutoffDate: expect.any(Date) },
    );
    expect(peticaoService.deleteManyWithFiles).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('No stale peticoes found for deletion.');
  });

  it('should delete stale peticoes when ids are found', async () => {
    const stalePeticoes = [
      { id: 1, caminhoArquivo: './uploads/peticoes/p1.pdf' },
      { id: 2, caminhoArquivo: './uploads/peticoes/p2.pdf' },
    ];
    (repository.queryBuilder.getRawMany as any).mockResolvedValueOnce(
      stalePeticoes,
    );
    peticaoService.deleteManyWithFiles.mockResolvedValueOnce({
      deleted: 2,
      fileDeleteFailures: 0,
    });

    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      return undefined;
    });

    await service.handleCron();

    expect(peticaoService.deleteManyWithFiles).toHaveBeenCalledWith(
      stalePeticoes,
    );
    expect(logSpy).toHaveBeenCalledWith(
      'Stale peticao cleanup finished. Deleted: 2. File delete failures: 0',
    );
  });

  it('should log error when query fails', async () => {
    (repository.queryBuilder.getRawMany as any).mockRejectedValueOnce(
      new Error('boom'),
    );

    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await service.handleCron();

    expect(errorSpy).toHaveBeenCalledWith(
      'Error running stale peticao cleanup job',
      expect.any(String),
    );
    expect(peticaoService.deleteManyWithFiles).not.toHaveBeenCalled();
  });
});
