import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { PrecedenteSugeridoEntity } from '../../precedents/entity/precedente_sugerido.entity';

export class MinutaSentencaDto {
  @ApiProperty({ description: 'O texto base do dispositivo' })
  @IsString()
  @IsNotEmpty()
  dispositivo: string;

  @ApiProperty({ description: 'Lista de IDs dos precedentes sugeridos', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  precedentesSugeridos: number[];

  @ApiProperty({ description: 'O ID do processo associado' })
  @IsNumber()
  @IsNotEmpty()
  processo_id: number;
}
