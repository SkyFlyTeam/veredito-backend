import { ApiProperty } from '@nestjs/swagger';
import DTOInterface from 'src/interfaces/dto.interface';

export default class CreatePeticaoDto implements DTOInterface {
  @ApiProperty({ example: 'Resumo da petição' })
  resumo: string;
  @ApiProperty({ example: 'tese_vetor' })
  tese_vetor: string;
  @ApiProperty({ example: 'questao_vetor' })
  questao_vetor: string;
  @ApiProperty({ example: 1 })
  user_id: number;
}
