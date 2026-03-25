import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusPrecedenteEntity } from '../entity/status_precedente.entity';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { CreateStatusPrecedenteDto } from '../dto/create-status-precedente.dto';

@Injectable()
export class StatusPrecedenteService {
  constructor(
    @InjectRepository(StatusPrecedenteEntity)
    private readonly statusPrecedenteRepository: Repository<StatusPrecedenteEntity>,
  ) {}

  create(dto: CreateStatusPrecedenteDto): Promise<StatusPrecedenteEntity> {
    const status = this.statusPrecedenteRepository.create(dto);
    return this.statusPrecedenteRepository.save(status);
  }

  findAll(): Promise<StatusPrecedenteEntity[]> {
    return this.statusPrecedenteRepository.find();
  }

  findOne(id: string | number): Promise<StatusPrecedenteEntity | null> {
    return this.statusPrecedenteRepository.findOne({
      where: { id: Number(id) },
    });
  }

  update(
    id: string | number,
    dto: CreateStatusPrecedenteDto,
  ): Promise<UpdateResult> {
    return this.statusPrecedenteRepository.update(Number(id), dto);
  }

  delete(id: string | number): Promise<DeleteResult> {
    return this.statusPrecedenteRepository.delete(Number(id));
  }
}
