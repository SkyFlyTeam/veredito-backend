import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { FiltrosDto } from './filtros.dto';

export class AnalisePeticaoDto {
  @IsNumber()
  @ApiProperty({ example: 1, description: 'ID da petição a ser analisada' })
  peticao_id: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => FiltrosDto)
  @ApiPropertyOptional({ type: FiltrosDto })
  filtros?: FiltrosDto;
}
