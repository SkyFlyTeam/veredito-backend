import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusPrecedenteEntity } from '../entity/status_precedente.entity';
import { Repository } from 'typeorm';
import { StatusPrecedenteEnumerator } from '../enumerator/status.enumerator';

@Injectable()
export class StatusPrecedenteSeed implements OnModuleInit {
  constructor(
    @InjectRepository(StatusPrecedenteEntity)
    private readonly statusPrecedenteRepository: Repository<StatusPrecedenteEntity>,
  ) {}

  async onModuleInit() {
    const defaultStatus = Object.values(StatusPrecedenteEnumerator);
    for (const status of defaultStatus) {
      const exists = await this.statusPrecedenteRepository.findOne({
        where: { nome: status },
      });

      if (!exists) {
        await this.statusPrecedenteRepository.save(
          this.statusPrecedenteRepository.create({ nome: status }),
        );
        console.log(`Status ${status} created`);
      }
    }
  }
}
