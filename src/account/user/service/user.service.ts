import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entity/user.entity';
import { AccessLevelEntity } from '../entity/access-level.entity';
import { Repository } from 'typeorm';
import ServiceInterface from 'src/interfaces/service.interface';
import DTOInterface from 'src/interfaces/dto.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';

type SafeUser = Omit<UserEntity, 'password'>;

@Injectable()
export class UserService implements ServiceInterface {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: UserRepository,

    @InjectRepository(AccessLevelEntity)
    private readonly accessLevelRepository: Repository<AccessLevelEntity>,
  ) {}

  private toSafeUser(user: UserEntity): SafeUser {
    const { password, ...safeUser } = user;
    void password;
    return safeUser;
  }

  private parseId(id: string): number {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new BadRequestException('ID inválido');
    }

    return parsedId;
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepository.find();
    return users.map((user) => this.toSafeUser(user));
  }

  async create(data: Partial<CreateUserDto>): Promise<SafeUser> {
    if (!data.nome || !data.sobrenome || !data.email || !data.password) {
      throw new BadRequestException('Dados obrigatórios não informados');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const accessLevel = await this.accessLevelRepository.findOne({
      where: { nome: data.accessLevel },
    });

    if (!accessLevel) {
      throw new BadRequestException('Nível de acesso inválido');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData = {
      nome: data.nome,
      sobrenome: data.sobrenome,
      email: data.email,
      password: Buffer.from(hashedPassword, 'utf-8'),
      accessLevel: accessLevel,
    };

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    return this.toSafeUser(savedUser);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOne(id: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findOne({
      where: { id: this.parseId(id) },
    });

    if (!user) {
      return null;
    }

    return this.toSafeUser(user);
  }

  async update(id: string, dto: DTOInterface): Promise<SafeUser> {
    const parsedId = this.parseId(id);
    const updateData = dto as Partial<CreateUserDto>;

    const user = await this.userRepository.findOne({ where: { id: parsedId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (updateData.email && updateData.email !== user.email) {
      const emailInUse = await this.userRepository.findOne({
        where: { email: updateData.email },
      });

      if (emailInUse) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    if (updateData.accessLevel) {
      const accessLevel = await this.accessLevelRepository.findOne({
        where: { nome: updateData.accessLevel },
      });

      if (!accessLevel) {
        throw new BadRequestException('Nível de acesso inválido');
      }

      user.accessLevel = accessLevel;
    }

    if (updateData.nome) {
      user.nome = updateData.nome;
    }

    if (updateData.sobrenome) {
      user.sobrenome = updateData.sobrenome;
    }

    if (updateData.email) {
      user.email = updateData.email;
    }

    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      user.password = Buffer.from(hashedPassword, 'utf-8');
    }

    const updatedUser = await this.userRepository.save(user);
    return this.toSafeUser(updatedUser);
  }

  async delete(id: string): Promise<SafeUser> {
    const parsedId = this.parseId(id);
    const user = await this.userRepository.findOne({ where: { id: parsedId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.userRepository.remove(user);
    return this.toSafeUser(user);
  }
}
