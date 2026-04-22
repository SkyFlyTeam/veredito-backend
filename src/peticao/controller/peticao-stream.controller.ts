import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Sse,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../account/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../account/auth/guards/roles.guard';
import { PipelineEvent } from '../dto/pipeline-event.dto';

@ApiTags('Petições-Stream-SSE')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('peticao')
export class PeticaoStreamController {
  constructor() {}

  @Get(':id/stream')
  @Sse()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Stream SSE da pipeline de análise',
    description: 'Abre conexão SSE para receber eventos da pipeline em tempo real',
  })
  @ApiResponse({
    status: 200,
    description: 'Stream iniciado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'search_1713696000000' },
        type: { type: 'string', example: 'search' },
        data: {
          type: 'string',
          description: 'JSON stringificado do evento',
        },
        retry: { type: 'number', example: 5000 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão',
  })
  @ApiResponse({
    status: 404,
    description: 'Petição não encontrada',
  })
  streamPipeline(
    @Param('id', ParseIntPipe) id: number,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      observer.error(
        new Error(
          'PipelineOrchestratorStream não foi injetado. Seu amigo precisa implementar a classe.',
        ),
      );
    });
  }
}
