import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProcessoDTO } from '../../dtos/processo.dto';
import PecaEntity from '../../entity/peca.entity';
import ProcessoJuridicoEntity from '../../entity/processo_juridico.entity';
import TipoPecaEntity from '../../entity/tipo_peca.entity';
import { ProcessInformation } from '../../types/process-information.type';
import { ProcessoPipelinePiece } from '../types/processo-pipeline-piece.type';

@Injectable()
export class ProcessoPipelinePersistenceService {
  constructor(
    @InjectRepository(ProcessoJuridicoEntity)
    private readonly processoRepository: Repository<ProcessoJuridicoEntity>,
    @InjectRepository(PecaEntity)
    private readonly pecaRepository: Repository<PecaEntity>,
    @InjectRepository(TipoPecaEntity)
    private readonly tipoPecaRepository: Repository<TipoPecaEntity>,
  ) {}

  async createProcesso(
    filePath: string,
    data: Partial<CreateProcessoDTO>,
    usuarioId: number,
  ): Promise<ProcessoJuridicoEntity> {
    if (
      data.instancia == null ||
      !data.classe_processual ||
      !data.area_direito ||
      data.tribunal_precedente == null ||
      !filePath
    ) {
      throw new BadRequestException('Dados obrigatórios não informados');
    }

    const processo = this.processoRepository.create({
      caminho_arquivo: filePath,
      instancia: data.instancia,
      classe_processual: data.classe_processual,
      area_direito: data.area_direito,
      usuario: { id: usuarioId } as ProcessoJuridicoEntity['usuario'],
      tribunal_precedente: {
        id: data.tribunal_precedente,
      } as ProcessoJuridicoEntity['tribunal_precedente'],
    });

    return this.processoRepository.save(processo);
  }

  async findProcessoOrFail(
    processoId: number,
  ): Promise<ProcessoJuridicoEntity> {
    const processo = await this.processoRepository.findOne({
      where: { id: processoId },
    });

    if (!processo) {
      throw new NotFoundException(
        `Processo com ID ${processoId} não encontrado`,
      );
    }

    return processo;
  }

  async savePieces(
    processo: ProcessoJuridicoEntity,
    pieces: ProcessoPipelinePiece[],
  ): Promise<PecaEntity[]> {
    const entities: PecaEntity[] = [];

    for (const piece of pieces) {
      const tipoPeca = await this.findOrCreateTipoPeca(piece.name);
      entities.push(
        this.pecaRepository.create({
          nome: piece.name,
          pagina_inicial: piece.startPage,
          tipo_peca: tipoPeca,
          processo_juridico: processo,
        }),
      );
    }

    return this.pecaRepository.save(entities);
  }

  async updateGeneralInfo(
    processo: ProcessoJuridicoEntity,
    information: ProcessInformation,
  ): Promise<ProcessoJuridicoEntity> {
    processo.fatos = information.fatos;
    processo.pedidos = information.pedidos;
    processo.fundamentos = information.fundamentosJuridicos;

    await this.processoRepository.save(processo);
    return this.findProcessoWithPieces(processo.id);
  }

  findProcessoWithPieces(processoId: number): Promise<ProcessoJuridicoEntity> {
    return this.processoRepository.findOneOrFail({
      where: { id: processoId },
      relations: {
        pecas: {
          tipo_peca: true,
        },
        peticao: true,
        tribunal_precedente: true,
      },
    });
  }

  private async findOrCreateTipoPeca(nome: string): Promise<TipoPecaEntity> {
    const existing = await this.tipoPecaRepository.findOne({ where: { nome } });

    if (existing) {
      return existing;
    }

    return this.tipoPecaRepository.save(
      this.tipoPecaRepository.create({ nome }),
    );
  }
}
