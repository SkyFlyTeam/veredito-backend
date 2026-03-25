import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EspeciePrecedenteEntity } from '../entity/especie_precedente.entity';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { CreateEspeciePrecedenteDto } from '../dto/create-especie-precedente.dto';

@Injectable()
export class EspeciePrecedenteService {
  constructor(
    @InjectRepository(EspeciePrecedenteEntity)
    private readonly especiePrecedenteRepository: Repository<EspeciePrecedenteEntity>,
  ) {}

  create(dto: CreateEspeciePrecedenteDto): Promise<EspeciePrecedenteEntity> {
    const especie = this.especiePrecedenteRepository.create(dto);
    return this.especiePrecedenteRepository.save(especie);
  }

  findAll(): Promise<EspeciePrecedenteEntity[]> {
    return this.especiePrecedenteRepository.find();
  }

  findOne(id: string | number): Promise<EspeciePrecedenteEntity | null> {
    return this.especiePrecedenteRepository.findOne({
      where: { id: Number(id) },
    });
  }

  update(
    id: string | number,
    dto: CreateEspeciePrecedenteDto,
  ): Promise<UpdateResult> {
    return this.especiePrecedenteRepository.update(Number(id), dto);
  }

  delete(id: string | number): Promise<DeleteResult> {
    return this.especiePrecedenteRepository.delete(Number(id));
  }
}
