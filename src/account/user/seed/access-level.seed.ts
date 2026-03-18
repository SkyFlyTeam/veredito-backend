import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessLevelEntity } from '../entity/access-level.entity';
import { AccessLevelEnumerator } from '../enumerator/access-level.enumerator';

@Injectable()
export class AccessLevelSeed implements OnModuleInit {
  constructor(
    @InjectRepository(AccessLevelEntity)
    private readonly accessLevelRepository: Repository<AccessLevelEntity>,
  ) {}

  async onModuleInit() {
    const defaultLevels = Object.values(AccessLevelEnumerator);

    for (const level of defaultLevels) {
      const exists = await this.accessLevelRepository.findOne({
        where: { nome: level },
      });

      if (!exists) {
        await this.accessLevelRepository.save(
          this.accessLevelRepository.create({ nome: level }),
        );
        console.log(`Access level '${level}' created`);
      }
    }
  }
}
