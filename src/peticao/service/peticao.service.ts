/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { PeticaoEntity } from '../entity/peticao.entity';
import { PeticaoResponseDTO } from '../dto/peticao-response.dto';
import { TextProcessingService } from '../pipeline-services/word_processing/text-processing.service';

@Injectable()
export class PeticaoService {
  private static readonly UPLOADS_ROOT = resolve('./uploads') + sep;

  constructor(
    @InjectRepository(PeticaoEntity)
    private readonly peticaoRepository: Repository<PeticaoEntity>,
    private readonly textProcessingService: TextProcessingService,
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

  async create(
    filePath: string,
    usuarioId: number,
  ): Promise<PeticaoResponseDTO> {
    const peticao = this.peticaoRepository.create({
      caminhoArquivo: filePath,
      usuarioId,
    });
    const savedPeticao = await this.peticaoRepository.save(peticao);
    return this.mapToResponseDTO(savedPeticao);
  }

  async deleteManyWithFiles(
    peticoes: Array<Pick<PeticaoEntity, 'id' | 'caminhoArquivo'>>,
  ): Promise<{ deleted: number; fileDeleteFailures: number }> {
    const idsToDelete = peticoes.map((item) => item.id);

    if (idsToDelete.length === 0) {
      return { deleted: 0, fileDeleteFailures: 0 };
    }

    const deleteResult = await this.peticaoRepository.delete(idsToDelete);

    const fileDeletionResults = await Promise.allSettled(
      peticoes.map((peticao) =>
        this.deleteUploadedFile(peticao.caminhoArquivo),
      ),
    );

    const fileDeleteFailures = fileDeletionResults.filter(
      (result) => result.status === 'rejected',
    ).length;

    return {
      deleted: deleteResult.affected ?? 0,
      fileDeleteFailures,
    };
  }

  private async deleteUploadedFile(filePath: string): Promise<void> {
    if (!filePath) {
      return;
    }

    const resolvedPath = resolve(filePath);
    if (!resolvedPath.startsWith(PeticaoService.UPLOADS_ROOT)) {
      return;
    }

    try {
      await unlink(resolvedPath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return;
      }

      throw error;
    }
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
