import { Injectable } from '@nestjs/common';
import { PeticaoSummary } from '../summary/summary.service';

@Injectable()
export class BuildSummaryTextStep {
  fromSummary(summary: PeticaoSummary): string {
    return `${summary.teseJuridica}\n${summary.solicitacaoPedido}`
      .replace(/\s+/g, ' ')
      .trim();
  }

  fromRawText(rawText: string): string {
    return rawText.replace(/\s+/g, ' ').trim();
  }
}
