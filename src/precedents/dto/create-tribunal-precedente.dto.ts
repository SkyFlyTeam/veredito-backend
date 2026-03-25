import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTribunalPrecedenteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ example: 'Tribunal de Justiça' })
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @ApiProperty({ example: 'TJ' })
  sigla: string;
}
