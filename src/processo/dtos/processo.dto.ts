import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProcessoDTO {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Arquivo do processo (.pdf, .docx, .txt)',
  })
  @IsOptional()
  file: any;

  @ApiProperty({
    type: 'number',
    description: 'Instância do processo',
    required: true,
  })
  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  instancia?: number;

  @ApiProperty({
    type: 'string',
    description: 'Classe processual do processo',
    required: true,
  })
  @IsDefined()
  @IsString()
  classe_processual?: string;

  @ApiProperty({
    type: 'string',
    description: 'Área de direito do processo',
    required: true,
  })
  @IsDefined()
  @IsString()
  area_direito?: string;

  @ApiProperty({
    type: 'number',
    description: 'Tribunal do processo',
    required: true,
  })
  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  tribunal_precedente?: number;
}
