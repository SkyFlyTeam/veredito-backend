import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeticaoEntity } from '../../entity/peticao.entity';
import { PeticaoSummary } from '../summary/summary.service';

export interface ResumeData {
  teseJuridica: string;
  solicitacaoPedido: string;
  resumoCompleto: string;
}

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    @InjectRepository(PeticaoEntity)
    private readonly peticaoRepository: Repository<PeticaoEntity>,
  ) {}

  /**
   * Saves the AI-generated summary to the petition entity
   * @param peticaoId - ID of the petition
   * @param summary - AI-generated summary from OpenAI
   * @returns Updated petition entity
   */
  async saveResume(
    peticaoId: number,
    summary: PeticaoSummary,
  ): Promise<PeticaoEntity> {
    this.logger.log(`Salvando resumo para petição ${peticaoId}`);

    const resumoCompleto = this.formatResume(summary);

    const peticao = await this.peticaoRepository.findOne({
      where: { id: peticaoId },
    });

    if (!peticao) {
      throw new Error(`Petição com ID ${peticaoId} não encontrada`);
    }

    peticao.resumo = resumoCompleto;
    await this.peticaoRepository.save(peticao);

    this.logger.log(
      `Resumo salvo com sucesso para petição ${peticaoId} (${resumoCompleto.length} caracteres)`,
    );

    return peticao;
  }

  /**
   * Gets the resume from a petition
   * @param peticaoId - ID of the petition
   * @returns Resume data or null if not found
   */
  async getResume(peticaoId: number): Promise<ResumeData | null> {
    const peticao = await this.peticaoRepository.findOne({
      where: { id: peticaoId },
      select: ['id', 'resumo'],
    });

    if (!peticao || !peticao.resumo) {
      return null;
    }

    return this.parseResume(peticao.resumo);
  }

  /**
   * Formats the AI summary into a complete resume string
   * @param summary - AI-generated summary
   * @returns Formatted resume string
   */
  private formatResume(summary: PeticaoSummary): string {
    return `TESE JURÍDICA:\n${summary.teseJuridica}\n\nSOLICITAÇÃO/PEDIDO:\n${summary.solicitacaoPedido}`;
  }

  /**
   * Parses a resume string back into structured data
   * @param resumoString - Resume string from database
   * @returns Parsed resume data
   */
  private parseResume(resumoString: string): ResumeData {
    const teseMatch = resumoString.match(
      /TESE JUR[IÍ]DICA:\s*([\s\S]*?)(?=SOLICITA[ÇC][ÃA]O\/PEDIDO:|$)/i,
    );
    const pedidoMatch = resumoString.match(
      /SOLICITA[ÇC][ÃA]O\/PEDIDO:\s*([\s\S]*?)$/i,
    );

    return {
      teseJuridica: teseMatch?.[1]?.trim() || '',
      solicitacaoPedido: pedidoMatch?.[1]?.trim() || '',
      resumoCompleto: resumoString,
    };
  }
}
