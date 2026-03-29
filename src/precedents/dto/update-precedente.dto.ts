import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';
import { StatusPrecedenteEntity } from '../entity/status_precedente.entity';
import { TribunalPrecedenteEntity } from '../entity/tribunal_precedente.entity';
import { EspeciePrecedenteEntity } from '../entity/especie_precedente.entity';

export class UpdatePrecedenteDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 1, description: 'ID do precedente a ser atualizado' })
  id: number;

  @IsOptional()
  @ApiProperty({
    example: 'Questão jurídica do precedente',
    description: 'Questão jurídica do precedente',
  })
  questao?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    example: 12345,
    description: 'Número de registro do precedente',
  })
  numero_registro?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Tese do precedente',
    description: 'Tese jurídica do precedente',
  })
  tese?: string;

  @IsOptional()
  @ApiProperty({
    example: [1.0, 2.5, 3.7],
    description: 'Vetor da tese para análise (array de números)',
  })
  tese_vetor?: number[];

  @IsOptional()
  @ApiProperty({
    example: [1.2, 2.8, 3.4],
    description: 'Vetor da questão para análise (array de números)',
  })
  questao_vetor?: number[];

  @IsOptional()
  @ApiProperty({
    example: { id: 1, nome: 'Ativo' },
    description: 'Objeto StatusPrecedenteEntity',
  })
  status?: StatusPrecedenteEntity;

  @IsOptional()
  @ApiProperty({
    example: { id: 1, nome: 'Tribunal de Justiça' },
    description: 'Objeto TribunalPrecedenteEntity',
  })
  tribunal?: TribunalPrecedenteEntity;

  @IsOptional()
  @ApiProperty({
    example: { id: 1, nome: 'Habeas Corpus' },
    description: 'Objeto EspeciePrecedenteEntity',
  })
  especie?: EspeciePrecedenteEntity;

  @IsOptional()
  @ApiProperty({
    example: new Date(),
    description:
      'Data da última atualização (opcional, usa data atual se não informado)',
  })
  ultima_atualizacao?: Date;
}
