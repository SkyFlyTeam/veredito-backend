import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, Max, Min } from 'class-validator';

export class CreatePrecedenteSugeridoDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  @ApiProperty({
    example: 85.5,
    description: 'Percentual de similaridade (0-100)',
  })
  percentual_similaridade: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  @ApiProperty({
    example: 4,
    description: 'Classificação (1-5)',
  })
  classificacao: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Síntese explicativa do precedente sugerido',
    description: 'Síntese explicativa do precedente',
    maxLength: 500,
  })
  sintese_explicativa: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'ID do precedente relacionado',
  })
  precedente_id: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'ID da petição relacionada',
  })
  peticao_id: number;
}
