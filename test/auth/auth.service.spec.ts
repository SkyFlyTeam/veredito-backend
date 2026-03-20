import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthService } from '../../src/account/auth/service/auth.service';
import { UserEntity } from '../../src/account/user/entity/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const makeUser = (): UserEntity => ({
  id: 1,
  nome: 'Dev',
  sobrenome: 'Local',
  email: 'skyfy.team@gmail.com',
  password: Buffer.from('hashed-password', 'utf-8'),
  accessLevel: {
    id: '1',
    nome: 'superuser',
    users: [],
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const createUserServiceMock = () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
});

const createJwtServiceMock = () => ({
  sign: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userService: ReturnType<typeof createUserServiceMock>;
  let jwtService: ReturnType<typeof createJwtServiceMock>;
  let compareMock: jest.MockedFunction<typeof bcrypt.compare>;

  beforeEach(() => {
    jest.resetAllMocks();

    userService = createUserServiceMock();
    jwtService = createJwtServiceMock();
    compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

    service = new AuthService(userService as never, jwtService as never);
  });

  describe('login', () => {
    it('deve retornar access_token quando credenciais são válidas', async () => {
      const user = makeUser();

      userService.findByEmail.mockResolvedValueOnce(user);
      compareMock.mockResolvedValueOnce(true as never);
      jwtService.sign.mockReturnValueOnce('token-jwt-fake');

      const result = await service.login({
        email: 'skyfy.team@gmail.com',
        password: 'Skyfly1403*',
      });

      expect(result).toEqual({ access_token: 'token-jwt-fake' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'skyfy.team@gmail.com',
        role: 'superuser',
      });
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      userService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.login({
          email: 'skyfy.team@gmail.com',
          password: 'Skyfly1403*',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(compareMock).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando senha é inválida', async () => {
      const user = makeUser();
      userService.findByEmail.mockResolvedValueOnce(user);
      compareMock.mockResolvedValueOnce(false as never);

      await expect(
        service.login({
          email: 'skyfy.team@gmail.com',
          password: 'senha-errada',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('deve comparar senha de entrada com hash salvo no banco', async () => {
      const user = makeUser();
      userService.findByEmail.mockResolvedValueOnce(user);
      compareMock.mockResolvedValueOnce(true as never);
      jwtService.sign.mockReturnValueOnce('token-jwt-fake');

      await service.login({
        email: 'skyfy.team@gmail.com',
        password: 'Skyfly1403*',
      });

      expect(compareMock).toHaveBeenCalledWith(
        'Skyfly1403*',
        user.password.toString('utf-8'),
      );
    });
  });
});
