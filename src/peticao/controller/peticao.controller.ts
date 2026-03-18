import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PeticaoService } from '../service/peticao.service';
import { PeticaoResponseDTO } from '../dto/peticao-response.dto';

@ApiTags('Petições')
@Controller('peticao')
export class PeticaoController {
  constructor(private readonly peticaoService: PeticaoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as petições' })
  @ApiResponse({
    status: 200,
    description: 'Lista de petições retornada com sucesso',
    type: [PeticaoResponseDTO],
  })
  findAll(): Promise<PeticaoResponseDTO[]> {
    return this.peticaoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter uma petição pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Petição retornada com sucesso',
    type: PeticaoResponseDTO,
  })
  @ApiResponse({ status: 404, description: 'Petição não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PeticaoResponseDTO> {
    return this.peticaoService.findOne(id);
  }
}
