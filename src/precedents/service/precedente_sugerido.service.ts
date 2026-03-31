/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PrecedenteSugeridoEntity } from '../entity/precedente_sugerido.entity';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { CreatePrecedenteSugeridoDto } from '../dto/create-precedente-sugerido.dto';
import { UpdatePrecedenteSugeridoDto } from '../dto/update-precedente-sugerido.dto';

@Injectable()
export class PrecedenteSugeridoService {
  constructor(
    @InjectRepository(PrecedenteSugeridoEntity)
    private readonly precedenteSugeridoRepository: Repository<PrecedenteSugeridoEntity>,
  ) {}

  create(dto: CreatePrecedenteSugeridoDto): Promise<PrecedenteSugeridoEntity> {
    const precedenteSugerido = this.precedenteSugeridoRepository.create({
      percentual_similaridade: dto.percentual_similaridade,
      classificacao: dto.classificacao,
      sintese_explicativa: dto.sintese_explicativa,
      precedente: { id: dto.precedente_id } as any,
      peticao: { id: dto.peticao_id } as any,
    });
    return this.precedenteSugeridoRepository.save(precedenteSugerido);
  }

  async createBulk(dtos: CreatePrecedenteSugeridoDto[]): Promise<PrecedenteSugeridoEntity[]> {
    const entities = dtos.map(dto => this.precedenteSugeridoRepository.create({
      percentual_similaridade: dto.percentual_similaridade,
      classificacao: dto.classificacao,
      sintese_explicativa: dto.sintese_explicativa,
      precedente: { id: dto.precedente_id } as any,
      peticao: { id: dto.peticao_id } as any,
    }));

    return this.precedenteSugeridoRepository.save(entities);
  }

  findAll(): Promise<PrecedenteSugeridoEntity[]> {
    return this.precedenteSugeridoRepository.find({
      relations: ['precedente', 'peticao'],
    });
  }

  findByPeticao(peticaoId: number): Promise<PrecedenteSugeridoEntity[]> {
    return this.precedenteSugeridoRepository.find({
      where: { peticaoId },
      relations: [
        'precedente',
        'precedente.status',
        'precedente.tribunal',
        'precedente.especie',
      ],
      order: { classificacao: 'ASC' },
    });
  }

  findOne(id: string | number): Promise<PrecedenteSugeridoEntity | null> {
    return this.precedenteSugeridoRepository.findOne({
      where: { id: Number(id) },
      relations: ['precedente', 'peticao'],
    });
  }

  update(
    id: string | number,
    dto: UpdatePrecedenteSugeridoDto,
  ): Promise<UpdateResult> {
    const { id: _, ...updateData } = dto;
    const data: any = {};

    if (updateData.percentual_similaridade !== undefined) {
      data.percentual_similaridade = updateData.percentual_similaridade;
    }
    if (updateData.classificacao !== undefined) {
      data.classificacao = updateData.classificacao;
    }
    if (updateData.sintese_explicativa !== undefined) {
      data.sintese_explicativa = updateData.sintese_explicativa;
    }
    if (updateData.precedente_id !== undefined) {
      data.precedente = { id: updateData.precedente_id };
    }
    if (updateData.peticao_id !== undefined) {
      data.peticao = { id: updateData.peticao_id };
    }

    return this.precedenteSugeridoRepository.update(Number(id), data);
  }

  delete(id: string | number): Promise<DeleteResult> {
    return this.precedenteSugeridoRepository.delete(Number(id));
  }
}
