import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class FiltrosDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiPropertyOptional({ example: [1, 2], description: 'IDs dos tribunais para filtrar' })
  tribunais?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiPropertyOptional({ example: [1], description: 'IDs das espécies para filtrar' })
  especies?: number[];
}
