import { ApiProperty } from '@nestjs/swagger';

export class UploadPeticaoDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Arquivo da petição (.pdf, .docx, .txt)' })
  file: any;
}
