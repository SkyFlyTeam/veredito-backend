import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

export interface SecaoPeticao {
  titulo: string;
  conteudo: string;
}

export interface CasoInfoPdf {
  uf: string;
  area_direito: string;
  tese_pretendida: string;
}

@Injectable()
export class PdfGeneratorService {
  gerarPeticaoPdf(secoes: SecaoPeticao[], casoInfo?: CasoInfoPdf): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const uf = casoInfo?.uf?.toUpperCase() || '[UF]';
      const tipoAcao = casoInfo?.tese_pretendida || '[TIPO DA AÇÃO]';

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(
          `EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DA ___ª VARA DA SEÇÃO JUDICIÁRIA DE ${uf}`,
          { align: 'left' },
        );

      doc.moveDown(2);

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(
          '[NOME DO(A) AUTOR(A)], [nacionalidade], [estado civil], [profissão], ' +
          'inscrito(a) no CPF sob o nº [●] e no RG nº [●], residente e domiciliado(a) na ' +
          '[endereço completo], por seu advogado (instrumento de mandato anexo), ' +
          'vem propor a presente',
          { align: 'justify', lineGap: 4 },
        );

      doc.moveDown(1.5);

      doc
        .font('Helvetica')
        .fontSize(13)
        .text(tipoAcao.toUpperCase(), { align: 'left' });

      doc.moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(12)
        .text('em face de', { align: 'left' });

      doc.moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(
          '[NOME COMPLETO DO(A) RÉU(RÉ)], [qualificação], ' +
          'pelas razões de fato e de direito a seguir expostas:',
          { align: 'left' },
        );

      doc.moveDown(2);

      // ── Seções geradas pela LLM ────────────────────────────────────────────
      for (const secao of secoes) {
        doc
          .font('Helvetica')
          .fontSize(12)
          .text(secao.titulo, { align: 'left' });

        doc.moveDown(0.5);

        doc
          .font('Helvetica')
          .fontSize(12)
          .text(secao.conteudo, { align: 'justify', lineGap: 4 });

        doc.moveDown(1.5);
      }

      // ── Encerramento padrão ────────────────────────────────────────────────
      doc.moveDown(1);
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(
          'Protesta provar o alegado por todos os meios de prova admitidos em direito.',
          { align: 'justify' },
        );

      doc.moveDown(0.5);
      doc.text('Dá-se à causa o valor de R$ [●].', { align: 'left' });
      doc.moveDown(0.5);
      doc.text('Nestes termos,', { align: 'left' });
      doc.moveDown(0.5);
      doc.text('Pede deferimento.', { align: 'left' });

      doc.moveDown(2);

      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      doc.text(`[Local], ${dataAtual}.`, { align: 'right' });

      doc.moveDown(3);

      doc
        .font('Helvetica')
        .text('__________________________________', { align: 'left' });
      doc.font('Helvetica').text('[Nome do Advogado]', { align: 'left' });
      doc.text('OAB/[UF] [Número]', { align: 'left' });

      doc.end();
    });
  }
}
