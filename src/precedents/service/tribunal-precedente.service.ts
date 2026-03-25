import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TribunalPrecedenteEntity } from '../entity/tribunal_precedente.entity';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { CreateTribunalPrecedenteDto } from '../dto/create-tribunal-precedente.dto';

@Injectable()
export class TribunalPrecedenteService {
  constructor(
    @InjectRepository(TribunalPrecedenteEntity)
    private readonly tribunalPrecedenteRepository: Repository<TribunalPrecedenteEntity>,
  ) {}

  create(dto: CreateTribunalPrecedenteDto): Promise<TribunalPrecedenteEntity> {
    const tribunal = this.tribunalPrecedenteRepository.create(dto);
    return this.tribunalPrecedenteRepository.save(tribunal);
  }

  findAll(): Promise<TribunalPrecedenteEntity[]> {
    return this.tribunalPrecedenteRepository.find();
  }

  findOne(id: string | number): Promise<TribunalPrecedenteEntity | null> {
    return this.tribunalPrecedenteRepository.findOne({
      where: { id: Number(id) },
    });
  }

  update(
    id: string | number,
    dto: CreateTribunalPrecedenteDto,
  ): Promise<UpdateResult> {
    return this.tribunalPrecedenteRepository.update(Number(id), dto);
  }

  delete(id: string | number): Promise<DeleteResult> {
    return this.tribunalPrecedenteRepository.delete(Number(id));
  }
}
