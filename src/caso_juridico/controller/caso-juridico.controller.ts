import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../account/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../account/auth/guards/roles.guard';
import { Roles } from '../../account/auth/decorators/roles.decorator';
import { CasoJuridicoService } from '../service/caso-juridico.service';
import { SecoesPeticaoEntity } from '../entity/secoes_peticao.entity';

@ApiTags('Casos Jurídicos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('caso-juridico')
export class CasoJuridicoController {
  constructor(private readonly casoJuridicoService: CasoJuridicoService) { }

  @Post(':id/gerar-peticao')
  @Roles('advogado', 'superuser')
  @ApiOperation({
    summary: 'Gerar petição inicial para um caso jurídico',
    description: 'Carrega as informações do caso e utiliza o modelo LLM para gerar as seções "Dos Fatos" e "Dos Pedidos".',
  })
  @ApiResponse({
    status: 201,
    description: 'Petição inicial gerada com sucesso',
    type: [SecoesPeticaoEntity],
  })
  @ApiResponse({
    status: 404,
    description: 'Caso jurídico não encontrado',
  })
  async gerarPeticao(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SecoesPeticaoEntity[]> {
    return this.casoJuridicoService.gerarPeticaoInicial(id);
  }
}
