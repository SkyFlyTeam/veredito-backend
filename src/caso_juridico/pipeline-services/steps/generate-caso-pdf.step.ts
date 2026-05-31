import { Injectable } from '@nestjs/common';
import { CasoJuridicoEntity } from '../../entity/caso_juridico.entity';
import { SecoesPeticaoEntity } from '../../entity/secoes_peticao.entity';
import { PdfGeneratorService } from '../../service/pdf-generator.service';

@Injectable()
export class GenerateCasoPdfStep {
  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {}

  execute(
    secoes: SecoesPeticaoEntity[],
    caso: CasoJuridicoEntity,
  ): Promise<Buffer> {
    return this.pdfGeneratorService.gerarPeticaoPdf(secoes, {
      uf: caso.uf,
      area_direito: caso.area_direito,
      tese_pretendida: caso.tese_pretendida,
    });
  }
}
