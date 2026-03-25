import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PrecedenteEntity from '../entity/precedente.entity';
import { Repository } from 'typeorm';
import { UpdateResult, DeleteResult } from 'typeorm';
import { CreatePrecedenteDto } from '../dto/create-precedente.dto';
import { UpdatePrecedenteDto } from '../dto/update-precedente.dto';

@Injectable()
export class PrecedenteService {
  constructor(
    @InjectRepository(PrecedenteEntity)
    private readonly precedenteRepository: Repository<PrecedenteEntity>,
  ) {}
  create(dto: CreatePrecedenteDto): Promise<PrecedenteEntity> {
    const precedente = this.precedenteRepository.create({
      ...dto,
      numero_registro: dto.numero_registro.toString(),
      ultima_atualizacao: dto.ultima_atualizacao || new Date(),
    });
    return this.precedenteRepository.save(precedente);
  }
  findAll(): Promise<PrecedenteEntity[]> {
    return this.precedenteRepository.find({
      relations: ['status', 'tribunal', 'especie', 'precedenteSugerido'],
    });
  }
  findOne(id: string | number): Promise<PrecedenteEntity | null> {
    return this.precedenteRepository.findOne({
      where: { id: Number(id) },
      relations: ['status', 'tribunal', 'especie', 'precedenteSugerido'],
    });
  }
  update(id: string | number, dto: UpdatePrecedenteDto): Promise<UpdateResult> {
    const updateData = {
      ...dto,
      numero_registro: dto.numero_registro?.toString(),
      ultima_atualizacao: dto.ultima_atualizacao || new Date(),
    };
    return this.precedenteRepository.update(Number(id), updateData);
  }
  delete(id: string | number): Promise<DeleteResult> {
    return this.precedenteRepository.delete(Number(id));
  }
}
