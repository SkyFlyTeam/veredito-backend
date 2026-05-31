import { PipelineEvent } from '../../../peticao/dto/pipeline-event.dto';
import { SecoesPeticaoEntity } from '../../entity/secoes_peticao.entity';
import { CasoJuridicoPipelineStage } from '../enums/caso-juridico-pipeline-stage.enum';

export interface CasoJuridicoSecoesEvent {
  stage: CasoJuridicoPipelineStage.SECOES;
  status: 'success';
  timestamp: Date;
  duration?: number;
  data: {
    secoes: SecoesPeticaoEntity[];
    total: number;
  };
}

export type CasoJuridicoPipelineEvent = CasoJuridicoSecoesEvent | PipelineEvent;
