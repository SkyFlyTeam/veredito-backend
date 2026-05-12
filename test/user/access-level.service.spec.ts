import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Not } from 'typeorm';
import { AccessLevelService } from '../../src/account/user/service/access-level.service';
import { AccessLevelEntity } from '../../src/account/user/entity/access-level.entity';
import { AccessLevelEnumerator } from '../../src/account/user/enumerator/access-level.enumerator';

describe('AccessLevelService', () => {
  let service: AccessLevelService;

  const mockAccessLevels: AccessLevelEntity[] = [
    { id: '2', nome: 'advogado', users: [] },
    { id: '3', nome: 'juiz', users: [] },
    { id: '4', nome: 'user', users: [] },
  ];

  const mockRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessLevelService,
        {
          provide: getRepositoryToken(AccessLevelEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccessLevelService>(AccessLevelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all access levels except superuser', async () => {
      mockRepository.find.mockResolvedValue(mockAccessLevels);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { nome: Not(AccessLevelEnumerator.SUPERUSER) },
        order: { nome: 'ASC' },
      });
      expect(result).toEqual(mockAccessLevels);
    });

    it('should not include superuser in the results', async () => {
      mockRepository.find.mockResolvedValue(mockAccessLevels);

      const result = await service.findAll();

      const hasSuperuser = result.some(
        (level) => level.nome === AccessLevelEnumerator.SUPERUSER,
      );
      expect(hasSuperuser).toBe(false);
    });

    it('should return an empty array when no access levels are found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
