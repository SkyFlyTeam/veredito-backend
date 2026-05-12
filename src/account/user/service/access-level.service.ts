import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { AccessLevelEntity } from '../entity/access-level.entity';
import { AccessLevelEnumerator } from '../enumerator/access-level.enumerator';

@Injectable()
export class AccessLevelService {
  constructor(
    @InjectRepository(AccessLevelEntity)
    private readonly accessLevelRepository: Repository<AccessLevelEntity>,
  ) {}

  findAll(): Promise<AccessLevelEntity[]> {
    return this.accessLevelRepository.find({
      where: { nome: Not(AccessLevelEnumerator.SUPERUSER) },
      order: { nome: 'ASC' },
    });
  }
}
