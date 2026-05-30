import { Injectable } from '@nestjs/common';
import { ProcessInformationService } from '../../service/process-information.service';
import { ProcessInformation } from '../../types/process-information.type';
import { ProcessPieces } from '../../types/process-pieces.type';

@Injectable()
export class ExtractProcessGeneralInfoStep {
  constructor(
    private readonly processInformationService: ProcessInformationService,
  ) {}

  execute(pieces: ProcessPieces): Promise<ProcessInformation> {
    return this.processInformationService.extractInformation(pieces);
  }
}
