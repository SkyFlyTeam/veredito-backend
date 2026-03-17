import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entity/user.entity';
import { AccessLevelEntity } from '../entity/access-level.entity';
import { Repository } from 'typeorm';
import ServiceInterface from 'src/interfaces/service.interface';
import DTOInterface from 'src/interfaces/dto.interface';
import { CreateUserDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UserService implements ServiceInterface {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: UserRepository,

    @InjectRepository(AccessLevelEntity)
    private readonly accessLevelRepository: Repository<AccessLevelEntity>,
  ) {}

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async create(data: Partial<CreateUserDto>): Promise<UserEntity> {
    await Promise.resolve();

    const accessLevel = await this.accessLevelRepository.findOne({
      where: { nome: data.accessLevel },
    });

    if (!accessLevel) {
      throw new Error('Nível de acesso inválido');
    }

    const userData = {
      nome: data.nome,
      email: data.email,
      password: data.password,
      accessLevel: accessLevel,
    };

    const user = this.userRepository.create(userData);

    return this.userRepository.save(user);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  findOne(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  update(id: string, dto: DTOInterface): Promise<UserEntity> {
    throw new Error(`Method not implemented. ${id} ${JSON.stringify(dto)}`);
  }
  delete(id: string): Promise<UserEntity> {
    throw new Error(`Method not implemented. ${id}`);
  }
}
