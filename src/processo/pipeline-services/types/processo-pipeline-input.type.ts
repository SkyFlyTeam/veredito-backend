import { CreateProcessoDTO } from '../../dtos/processo.dto';
import ProcessoJuridicoEntity from '../../entity/processo_juridico.entity';

export interface ProcessoPipelineFileInput {
  filePath: string;
  originalname?: string;
  createData: Partial<CreateProcessoDTO>;
  usuarioId: number;
}

export interface ProcessoPipelineInput {
  processo: ProcessoJuridicoEntity;
}
