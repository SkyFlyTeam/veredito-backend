import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { StatusPrecedenteEntity } from '../entity/status_precedente.entity';
import { TribunalPrecedenteEntity } from '../entity/tribunal_precedente.entity';
import { EspeciePrecedenteEntity } from '../entity/especie_precedente.entity';

export class UpdatePrecedenteDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'ID do precedente a ser atualizado' })
  id: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 12345, description: 'Número de registro do precedente' })
  numero_registro?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Tese do precedente', description: 'Tese jurídica do precedente' })
  tese?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'tese vetor', description: 'Vetor da tese para análise' })
  tese_vetor?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'questao vetor', description: 'Vetor da questão para análise' })
  questao_vetor?: string;

  @IsOptional()
  @ApiProperty({ example: { id: 1, nome: 'Ativo' }, description: 'Objeto StatusPrecedenteEntity' })
  status?: StatusPrecedenteEntity;

  @IsOptional()
  @ApiProperty({ example: { id: 1, nome: 'Tribunal de Justiça' }, description: 'Objeto TribunalPrecedenteEntity' })
  tribunal?: TribunalPrecedenteEntity;

  @IsOptional()
  @ApiProperty({ example: { id: 1, nome: 'Habeas Corpus' }, description: 'Objeto EspeciePrecedenteEntity' })
  especie?: EspeciePrecedenteEntity;

  @IsOptional()
  @ApiProperty({
    example: new Date(),
    description: 'Data da última atualização (opcional, usa data atual se não informado)',
  })
  ultima_atualizacao?: Date;
}
