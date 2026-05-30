import { PipelineEvent } from '../../../peticao/dto/pipeline-event.dto';
import ProcessoJuridicoEntity from '../../entity/processo_juridico.entity';
import { ProcessInformation } from '../../types/process-information.type';
import { ProcessoPipelineStage } from '../enums/processo-pipeline-stage.enum';
import { ProcessoPipelinePiece } from './processo-pipeline-piece.type';

export interface ProcessoPipelineBaseEvent {
  stage: ProcessoPipelineStage | PipelineEvent['stage'];
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
  duration?: number;
  data: any;
}

export interface ProcessoPecasEvent extends ProcessoPipelineBaseEvent {
  stage: ProcessoPipelineStage.PECAS;
  status: 'success';
  data: {
    pieces: ProcessoPipelinePiece[];
    totalFound: number;
  };
}

export interface ProcessoGeneralInfoEvent extends ProcessoPipelineBaseEvent {
  stage: ProcessoPipelineStage.GENERAL_INFO;
  status: 'success';
  data: {
    information: ProcessInformation;
    processo: ProcessoJuridicoEntity;
  };
}

export type ProcessoPipelineEvent =
  | ProcessoPecasEvent
  | ProcessoGeneralInfoEvent
  | PipelineEvent;
