import { ApiProperty } from '@nestjs/swagger';

/**
 * Tipo de retorno estruturado do serviço de extração de documentos jurídicos.
 * Contém os fatos estruturados e os fundamentos jurídicos extraídos dos documentos enviados.
 */
export class CasoJuridicoInformations {
  @ApiProperty({
    description:
      'Fatos estruturados extraídos dos documentos. Narrativa objetiva dos acontecimentos ' +
      'relevantes ao caso (mínimo 1 parágrafo / máximo 5 parágrafos).',
    example:
      'O requerente firmou contrato de prestação de serviços com a requerida em 10/01/2024...',
  })
  fatosEstruturados: string;

  @ApiProperty({
    description:
      'Fundamentos jurídicos identificados nos documentos. Dispositivos legais, princípios ' +
      'e teses jurídicas aplicáveis ao caso (mínimo 1 parágrafo / máximo 5 parágrafos).',
    example:
      'O presente caso encontra amparo no art. 186 do Código Civil, que trata da responsabilidade civil...',
  })
  fundamentosJuridicos: string;
}
