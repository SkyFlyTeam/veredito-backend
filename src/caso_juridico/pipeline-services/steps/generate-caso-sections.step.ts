import { Injectable } from '@nestjs/common';
import { SecoesPeticaoEntity } from '../../entity/secoes_peticao.entity';
import { CasoJuridicoService } from '../../service/caso-juridico.service';

@Injectable()
export class GenerateCasoSectionsStep {
  constructor(private readonly casoJuridicoService: CasoJuridicoService) {}

  execute(casoId: number): Promise<SecoesPeticaoEntity[]> {
    return this.casoJuridicoService.gerarPeticaoInicial(casoId);
  }
}
