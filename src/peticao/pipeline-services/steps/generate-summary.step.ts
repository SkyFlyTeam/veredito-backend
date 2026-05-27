import { Injectable } from '@nestjs/common';
import { SummaryService, PeticaoSummary } from '../summary/summary.service';

@Injectable()
export class GenerateSummaryStep {
  constructor(private readonly summaryService: SummaryService) {}

  execute(rawText: string): Promise<PeticaoSummary> {
    return this.summaryService.summarize(rawText);
  }

  format(summary: PeticaoSummary): string {
    return `TESE JURÍDICA:\n${summary.teseJuridica}\n\nSOLICITAÇÃO/PEDIDO:\n${summary.solicitacaoPedido}`;
  }
}
