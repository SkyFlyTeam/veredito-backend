import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import DTOInterface from 'src/interfaces/dto.interface';

export class CreateCasoJuridicoDto extends DTOInterface {
  @ApiProperty({
    description: 'Área do direito do caso',
    example: 'Direito do Trabalho',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  area_direito!: string;

  @ApiProperty({
    description: 'Pedidos principais do caso',
    example: 'Indenização por danos morais e materiais',
  })
  @IsString()
  @IsNotEmpty()
  pedidos_principais!: string;

  @ApiProperty({
    description: 'Tese pretendida',
    example: 'Responsabilidade civil do empregador',
  })
  @IsString()
  @IsNotEmpty()
  tese_pretendida!: string;

  @ApiProperty({ description: 'UF do caso (2 caracteres)', example: 'SP' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  uf!: string;

  @ApiProperty({
    description: 'Fatos estruturados informados no formulário pelo advogado',
    example: 'O cliente foi demitido sem pagamento das verbas rescisórias.',
  })
  @IsString()
  @IsNotEmpty()
  fatos_estruturados!: string;

  @ApiProperty({
    description: 'Fundamentos jurídicos informados no formulário pelo advogado',
    example: 'Arts. 477 e 483 da CLT; art. 186 CC.',
  })
  @IsString()
  @IsNotEmpty()
  fundamentos_juridicos!: string;

  @ApiProperty({
    description: 'ID do tribunal precedente',
    example: 1,
  })
  @IsNumber()
  tribunalPrecedenteId!: number;
}
