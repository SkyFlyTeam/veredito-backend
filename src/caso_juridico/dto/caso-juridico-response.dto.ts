import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import DTOInterface from 'src/interfaces/dto.interface';

export class CasoJuridicoResponseDto extends DTOInterface {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Direito do Trabalho' })
  area_direito: string;

  @ApiProperty({ example: 'Indenização por danos morais e materiais' })
  pedidos_principais: string;

  @ApiProperty({ example: 'Responsabilidade civil do empregador' })
  tese_pretendida: string;

  @ApiProperty({ example: 'SP' })
  uf: string;

  @ApiPropertyOptional({ example: 'O requerente firmou contrato de trabalho...' })
  fatos_estruturados?: string;

  @ApiPropertyOptional({ example: 'O caso encontra amparo no art. 186 do CC...' })
  fundamentos_juridicos?: string;

  @ApiPropertyOptional({ example: 1 })
  tribunalPrecedenteId?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ example: 1 })
  usuarioId: number;
}