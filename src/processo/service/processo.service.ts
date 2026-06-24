import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import { resolve, sep } from 'node:path';
import ProcessoJuridicoEntity from '../entity/processo_juridico.entity';
import { CreateProcessoDTO } from '../dtos/processo.dto';
import { ProcessoResponseDTO } from '../dtos/processo-response.dto';

@Injectable()
export class ProcessoService {
  private static readonly UPLOADS_ROOT = resolve('./uploads') + sep;

  constructor(
    @InjectRepository(ProcessoJuridicoEntity)
    private readonly processoRepository: Repository<ProcessoJuridicoEntity>,
  ) {}

  async findAll(): Promise<ProcessoResponseDTO[]> {
    const processos = await this.processoRepository.find({
      relations: {
        peticao: true,
        tribunal_precedente: true,
      },
    });

    return processos.map((processo) => this.mapToResponseDTO(processo));
  }

  async findOne(id: number): Promise<ProcessoResponseDTO> {
    const processo = await this.processoRepository.findOne({
      where: { id },
      relations: {
        peticao: true,
        tribunal_precedente: true,
      },
    });

    if (!processo) {
      throw new NotFoundException(`Processo with ID ${id} not found`);
    }

    return this.mapToResponseDTO(processo);
  }

  async getMockedResponseForDocumentoPublico(): Promise<ProcessoResponseDTO> {
    const mockedProcessoId = Number(process.env.MOCKED_PROCESSO_ID);

    if (!Number.isSafeInteger(mockedProcessoId) || mockedProcessoId <= 0) {
      throw new BadRequestException(
        'MOCKED_PROCESSO_ID deve conter o ID válido de um processo já analisado',
      );
    }

    return this.findOne(mockedProcessoId);
  }

  async create(
    data: Partial<CreateProcessoDTO> & { file: string },
    usuarioId: number,
  ): Promise<ProcessoResponseDTO> {
    if (
      data.instancia == null ||
      !data.classe_processual ||
      !data.area_direito ||
      data.tribunal_precedente == null ||
      !data.file
    ) {
      throw new BadRequestException('Dados obrigatórios não informados');
    }

    const processo = this.processoRepository.create();
    processo.caminho_arquivo = data.file;
    processo.instancia = data.instancia;
    processo.classe_processual = data.classe_processual;
    processo.area_direito = data.area_direito;
    processo.usuario = { id: usuarioId } as ProcessoJuridicoEntity['usuario'];
    processo.tribunal_precedente = {
      id: data.tribunal_precedente,
    } as ProcessoJuridicoEntity['tribunal_precedente'];

    const savedProcesso = await this.processoRepository.save(processo);
    return this.findOne(savedProcesso.id);
  }

  async delete(id: number): Promise<void> {
    const processo = await this.processoRepository.findOne({
      where: { id },
      relations: {
        usuario: true,
        peticao: true,
        tribunal_precedente: true,
      },
    });

    if (!processo) {
      throw new NotFoundException(`Processo with ID ${id} not found`);
    }

    await this.processoRepository.delete(id);
    await this.deleteUploadedFile(processo.caminho_arquivo);
  }

  private async deleteUploadedFile(filePath: string): Promise<void> {
    if (!filePath) {
      return;
    }

    const resolvedPath = resolve(filePath);
    if (!resolvedPath.startsWith(ProcessoService.UPLOADS_ROOT)) {
      return;
    }

    try {
      await unlink(resolvedPath);
    } catch (error) {
      const unlinkError = error as NodeJS.ErrnoException;
      if (unlinkError.code === 'ENOENT') {
        return;
      }

      throw error;
    }
  }

  private mapToResponseDTO(
    processo: ProcessoJuridicoEntity,
  ): ProcessoResponseDTO {
    return {
      id: processo.id,
      caminhoArquivo: processo.caminho_arquivo,
      instancia: processo.instancia,
      classeProcessual: processo.classe_processual,
      areaDireito: processo.area_direito,
      pedidos: processo.pedidos,
      fundamentos: processo.fundamentos,
      fatos: processo.fatos,
      createdAt: processo.created_at,
      peticaoId: processo.peticao?.id ?? null,
      tribunalPrecedenteId: processo.tribunal_precedente?.id ?? null,
    };
  }
}
