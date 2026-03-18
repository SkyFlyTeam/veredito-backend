import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeticaoEntity } from '../entity/peticao.entity';
import { PeticaoResponseDTO } from '../dto/peticao-response.dto';

@Injectable()
export class PeticaoService {
  constructor(
    @InjectRepository(PeticaoEntity)
    private readonly peticaoRepository: Repository<PeticaoEntity>,
  ) {}

  async findAll(): Promise<PeticaoResponseDTO[]> {
    const peticoes = await this.peticaoRepository.find();
    return peticoes.map((p) => this.mapToResponseDTO(p));
  }

  async findOne(id: number): Promise<PeticaoResponseDTO> {
    const peticao = await this.peticaoRepository.findOne({ where: { id } });

    if (!peticao) {
      throw new NotFoundException(`Petição com ID ${id} não encontrada`);
    }

    return this.mapToResponseDTO(peticao);
  }

  private mapToResponseDTO(peticao: PeticaoEntity): PeticaoResponseDTO {
    return {
      id: peticao.id,
      caminhoArquivo: peticao.caminhoArquivo,
      resumo: peticao.resumo,
      createdAt: peticao.createdAt,
      usuarioId: peticao.usuarioId,
    };
  }
}
