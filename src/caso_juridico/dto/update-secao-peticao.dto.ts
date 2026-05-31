import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSecaoPeticaoDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Texto atualizado da secao de peticao.',
    description: 'Conteudo atualizado da secao da peticao.',
  })
  conteudo: string;
}
