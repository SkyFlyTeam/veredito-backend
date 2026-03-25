import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdatePrecedenteSugeridoDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'ID do precedente sugerido a ser atualizado',
  })
  id: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({
    example: 85.5,
    description: 'Percentual de similaridade (0-100)',
  })
  percentual_similaridade?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiProperty({
    example: 4,
    description: 'Classificação (1-5)',
  })
  classificacao?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Síntese explicativa do precedente sugerido',
    description: 'Síntese explicativa do precedente',
    maxLength: 500,
  })
  sintese_explicativa?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'ID do precedente relacionado',
  })
  precedente_id?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'ID da petição relacionada',
  })
  peticao_id?: number;
}
