import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';

jest.mock('@nestjs/schedule', () => ({
  Cron: () => {
    return () => undefined;
  },
}), { virtual: true });

import { PeticaoDeleteCronService } from '../../src/crons/jobs/peticao-delete.cron';

type RawId = { id: number };

type QueryBuilderMock = {
  leftJoin: jest.Mock;
  select: jest.Mock;
  where: jest.Mock;
  groupBy: jest.Mock;
  having: jest.Mock;
  getRawMany: jest.Mock;
};

const createQueryBuilderMock = (): QueryBuilderMock => {
  const qb = {
    leftJoin: jest.fn(),
    select: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    having: jest.fn(),
    getRawMany: jest.fn<() => Promise<RawId[]>>(),
  } as QueryBuilderMock;

  qb.leftJoin.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.groupBy.mockReturnValue(qb);
  qb.having.mockReturnValue(qb);

  return qb;
};

const createRepositoryMock = () => {
  const queryBuilder = createQueryBuilderMock();

  return {
    queryBuilder,
    createQueryBuilder: jest.fn(() => queryBuilder),
    delete: jest.fn(() => Promise.resolve({ affected: 0 })),
  };
};

describe('PeticaoDeleteCronService', () => {
  let service: PeticaoDeleteCronService;
  let repository: ReturnType<typeof createRepositoryMock>;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = createRepositoryMock();
    service = new PeticaoDeleteCronService(repository as never);
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
    repository.queryBuilder.getRawMany.mockResolvedValueOnce([]);

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
    expect(repository.delete).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('No stale peticoes found for deletion.');
  });

  it('should delete stale peticoes when ids are found', async () => {
    repository.queryBuilder.getRawMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    repository.delete.mockResolvedValueOnce({ affected: 2 });

    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      return undefined;
    });

    await service.handleCron();

    expect(repository.delete).toHaveBeenCalledWith([1, 2]);
    expect(logSpy).toHaveBeenCalledWith(
      'Stale peticao cleanup finished. Deleted: 2',
    );
  });

  it('should log error when query fails', async () => {
    repository.queryBuilder.getRawMany.mockRejectedValueOnce(new Error('boom'));

    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await service.handleCron();

    expect(errorSpy).toHaveBeenCalledWith(
      'Error running stale peticao cleanup job',
      expect.any(String),
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
