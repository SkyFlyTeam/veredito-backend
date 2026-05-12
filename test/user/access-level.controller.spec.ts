import { AccessLevelController } from '../../src/account/user/controller/access-level.controller';
import { AccessLevelService } from '../../src/account/user/service/access-level.service';
import { AccessLevelEntity } from '../../src/account/user/entity/access-level.entity';

describe('AccessLevelController', () => {
  let controller: AccessLevelController;
  let service: jest.Mocked<AccessLevelService>;

  const mockAccessLevels: AccessLevelEntity[] = [
    { id: '2', nome: 'advogado', users: [] },
    { id: '3', nome: 'juiz', users: [] },
    { id: '4', nome: 'user', users: [] },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    service = { findAll: jest.fn() } as any;
    controller = new AccessLevelController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all access levels from the service', async () => {
      service.findAll.mockResolvedValue(mockAccessLevels);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccessLevels);
    });

    it('should return an empty array when service returns no results', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });
});
