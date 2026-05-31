import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { FiltrosDto } from '../../peticao/dto/filtros.dto';

export class AnaliseCasoJuridicoDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FiltrosDto)
  @ApiPropertyOptional({ type: FiltrosDto })
  filtros?: FiltrosDto;
}
