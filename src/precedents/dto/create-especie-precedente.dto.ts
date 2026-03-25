import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateEspeciePrecedenteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    description: 'Nome da espécie de precedente',
    example: 'Habeas Corpus',
  })
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @ApiProperty({
    description: 'Sigla da espécie de precedente',
    example: 'HC',
  })
  sigla: string;
}
