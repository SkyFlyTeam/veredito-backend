import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CasoJuridicoEntity } from '../entity/caso_juridico.entity';
import { CreateCasoJuridicoDto } from '../dto/create-caso-juridico.dto';
import { CasoJuridicoResponseDto } from '../dto/caso-juridico-response.dto';
import { CasoJuridicoExtractionService } from './caso-juridico-extraction.service';

@Injectable()
export class CasoJuridicoCrudService {
  constructor(
    @InjectRepository(CasoJuridicoEntity)
    private readonly casoRepository: Repository<CasoJuridicoEntity>,
    private readonly extractionService: CasoJuridicoExtractionService,
  ) {}

  async create(
    dto: CreateCasoJuridicoDto,
    files: any[],
    usuarioId: number,
  ): Promise<CasoJuridicoResponseDto> {
    // Repassa os documentos para o serviço de extração
    const { fatosEstruturados, fundamentosJuridicos } =
      await this.extractionService.extractFromDocuments(files);

    const caso = this.casoRepository.create({
      area_direito: dto.area_direito,
      pedidos_principais: dto.pedidos_principais,
      tese_pretendida: dto.tese_pretendida,
      uf: dto.uf,
      tribunalPrecedenteId: dto.tribunalPrecedenteId ?? null,
      fatos_estruturados: fatosEstruturados,
      fundamentos_juridicos: fundamentosJuridicos,
      usuarioId,
    });

    const saved = await this.casoRepository.save(caso);
    return this.mapToResponseDto(saved);
  }

  async findAll(): Promise<CasoJuridicoResponseDto[]> {
    const casos = await this.casoRepository.find({
      order: { createdAt: 'DESC' },
    });
    return casos.map((c) => this.mapToResponseDto(c));
  }

  async findOne(id: number): Promise<CasoJuridicoResponseDto> {
    const caso = await this.casoRepository.findOne({ where: { id } });

    if (!caso) {
      throw new NotFoundException(`Caso Jurídico com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(caso);
  }

  async delete(id: number): Promise<void> {
    const caso = await this.casoRepository.findOne({ where: { id } });

    if (!caso) {
      throw new NotFoundException(`Caso Jurídico com ID ${id} não encontrado`);
    }

    await this.casoRepository.delete(id);
  }

  private mapToResponseDto(caso: CasoJuridicoEntity): CasoJuridicoResponseDto {
    return {
      id: caso.id,
      area_direito: caso.area_direito,
      pedidos_principais: caso.pedidos_principais,
      tese_pretendida: caso.tese_pretendida,
      uf: caso.uf,
      fatos_estruturados: caso.fatos_estruturados,
      fundamentos_juridicos: caso.fundamentos_juridicos,
      tribunalPrecedenteId: caso.tribunalPrecedenteId,
      createdAt: caso.createdAt,
      usuarioId: caso.usuarioId,
    };
  }
}