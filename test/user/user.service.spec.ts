import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UserService } from '../../src/account/user/service/user.service';
import { UserEntity } from '../../src/account/user/entity/user.entity';
import { AccessLevelEntity } from '../../src/account/user/entity/access-level.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

const makeAccessLevel = (): AccessLevelEntity => ({
  id: '1',
  nome: 'admin',
  users: [],
});

const makeUser = (): UserEntity => ({
  id: 1,
  nome: 'Ivan',
  sobrenome: 'Silva',
  email: 'ivan@example.com',
  password: Buffer.from('hashed-password', 'utf-8'),
  accessLevel: makeAccessLevel(),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const createUserRepositoryMock = () => ({
  find: jest.fn((): Promise<UserEntity[]> => Promise.resolve([])),
  findOne: jest.fn((): Promise<UserEntity | null> => Promise.resolve(null)),
  create: jest.fn((payload: unknown): unknown => payload),
  save: jest.fn(
    (user: UserEntity): Promise<UserEntity> => Promise.resolve(user),
  ),
  remove: jest.fn((user: UserEntity): Promise<void> => {
    void user;
    return Promise.resolve(undefined);
  }),
});

const createAccessLevelRepositoryMock = () => ({
  findOne: jest.fn(
    (): Promise<AccessLevelEntity | null> => Promise.resolve(null),
  ),
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('UserService', () => {
  let service: UserService;
  let userRepository: ReturnType<typeof createUserRepositoryMock>;
  let accessLevelRepository: ReturnType<typeof createAccessLevelRepositoryMock>;
  let hashMock: jest.MockedFunction<typeof bcrypt.hash>;

  beforeEach(() => {
    jest.resetAllMocks();
    userRepository = createUserRepositoryMock();
    accessLevelRepository = createAccessLevelRepositoryMock();
    hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

    service = new UserService(
      userRepository as never,
      accessLevelRepository as never,
    );
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('deve hashear a senha antes de persistir', async () => {
      const user = makeUser();

      userRepository.findOne.mockResolvedValueOnce(null); // e-mail ainda não existe
      accessLevelRepository.findOne.mockResolvedValueOnce(makeAccessLevel());
      userRepository.create.mockImplementation(
        (payload) => payload as UserEntity,
      );
      userRepository.save.mockResolvedValueOnce(user);

      hashMock.mockResolvedValueOnce('hashed-password' as never);

      await service.create({
        nome: 'Ivan',
        sobrenome: 'Silva',
        email: 'ivan@example.com',
        password: 'skyfly1403*',
        accessLevel: 'admin',
      });

      expect(hashMock).toHaveBeenCalled();
      expect(hashMock.mock.calls[0]?.[0]).toBe('skyfly1403*');
      expect(hashMock.mock.calls[0]?.[1]).toBe(10);
    });

    it('deve persistir a senha como Buffer após o hash', async () => {
      const user = makeUser();

      userRepository.findOne.mockResolvedValueOnce(null);
      accessLevelRepository.findOne.mockResolvedValueOnce(makeAccessLevel());
      userRepository.create.mockImplementation(
        (payload) => payload as UserEntity,
      );
      userRepository.save.mockResolvedValueOnce(user);

      hashMock.mockResolvedValueOnce('hashed-password' as never);

      await service.create({
        nome: 'Ivan',
        sobrenome: 'Silva',
        email: 'ivan@example.com',
        password: 'skyfly1403*',
        accessLevel: 'admin',
      });

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: Buffer.from('hashed-password', 'utf-8'),
        }),
      );
    });

    it('não deve retornar a senha na resposta', async () => {
      const user = makeUser();

      userRepository.findOne.mockResolvedValueOnce(null);
      accessLevelRepository.findOne.mockResolvedValueOnce(makeAccessLevel());
      userRepository.create.mockImplementation(
        (payload) => payload as UserEntity,
      );
      userRepository.save.mockResolvedValueOnce(user);

      hashMock.mockResolvedValueOnce('hashed-password' as never);

      const result = await service.create({
        nome: 'Ivan',
        sobrenome: 'Silva',
        email: 'ivan@example.com',
        password: 'skyfly1403*',
        accessLevel: 'admin',
      });

      expect((result as Partial<UserEntity>).password).toBeUndefined();
    });

    it('deve lançar ConflictException quando o e-mail já estiver cadastrado', async () => {
      userRepository.findOne.mockResolvedValueOnce(makeUser()); // e-mail já existe

      await expect(
        service.create({
          nome: 'Ivan',
          sobrenome: 'Silva',
          email: 'ivan@example.com',
          password: 'skyfly1403*',
          accessLevel: 'admin',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar BadRequestException quando o accessLevel não existir', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      accessLevelRepository.findOne.mockResolvedValueOnce(null); // level inválido

      await expect(
        service.create({
          nome: 'Ivan',
          sobrenome: 'Silva',
          email: 'ivan@example.com',
          password: 'skyfly1403*',
          accessLevel: 'inexistente',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('deve retornar a lista de usuários', async () => {
      userRepository.find.mockResolvedValueOnce([makeUser(), makeUser()]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });

    it('não deve retornar a senha em nenhum usuário', async () => {
      userRepository.find.mockResolvedValueOnce([makeUser(), makeUser()]);

      const result = await service.findAll();

      result.forEach((user) => {
        expect((user as Partial<UserEntity>).password).toBeUndefined();
      });
    });

    it('deve retornar array vazio quando não houver usuários', async () => {
      userRepository.find.mockResolvedValueOnce([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('deve retornar o usuário correspondente ao id', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValueOnce(user);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
    });

    it('não deve retornar a senha', async () => {
      userRepository.findOne.mockResolvedValueOnce(makeUser());

      const result = await service.findOne('1');

      expect((result as Partial<UserEntity>).password).toBeUndefined();
    });

    it('deve retornar null quando o usuário não existir', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('999')).resolves.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('deve atualizar os dados do usuário', async () => {
      const user = makeUser();
      const updated = { ...user, nome: 'Carlos' };

      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.save.mockResolvedValueOnce(updated);

      const result = await service.update('1', { nome: 'Carlos' });

      expect(result).toBeDefined();
    });

    it('não deve retornar a senha após atualização', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.save.mockResolvedValueOnce({ ...user, nome: 'Carlos' });

      const result = await service.update('1', { nome: 'Carlos' });

      expect((result as Partial<UserEntity>).password).toBeUndefined();
    });

    it('deve hashear a nova senha quando ela for fornecida', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.save.mockResolvedValueOnce(user);

      hashMock.mockResolvedValueOnce('novo-hash' as never);

      await service.update('1', { password: 'novaSenha123*' });

      expect(hashMock).toHaveBeenCalled();
      expect(hashMock.mock.calls[0]?.[0]).toBe('novaSenha123*');
      expect(hashMock.mock.calls[0]?.[1]).toBe(10);
    });

    it('deve lançar NotFoundException quando o usuário não existir', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.update('999', { nome: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('delete', () => {
    it('deve remover o usuário existente', async () => {
      const user = makeUser();
      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.remove.mockResolvedValueOnce(undefined);

      await expect(service.delete('1')).resolves.not.toThrow();
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });

    it('deve lançar NotFoundException quando o usuário não existir', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.delete('999')).rejects.toThrow(NotFoundException);
    });
  });
});
