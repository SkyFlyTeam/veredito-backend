import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import DTOInterface from 'src/interfaces/dto.interface';

export class CreateCasoJuridicoDto extends DTOInterface {
  @ApiProperty({
    description: 'Área do direito do caso',
    example: 'Direito do Trabalho',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  area_direito: string;

  @ApiProperty({
    description: 'Pedidos principais do caso',
    example: 'Indenização por danos morais e materiais',
  })
  @IsString()
  @IsNotEmpty()
  pedidos_principais: string;

  @ApiProperty({
    description: 'Tese pretendida',
    example: 'Responsabilidade civil do empregador',
  })
  @IsString()
  @IsNotEmpty()
  tese_pretendida: string;

  @ApiProperty({ description: 'UF do caso (2 caracteres)', example: 'SP' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  uf: string;

  @ApiPropertyOptional({
    description: 'ID do tribunal precedente (opcional)',
    example: 1,
  })
  @IsOptional()
  tribunalPrecedenteId?: number;
}
