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

/**
 * Controller para streaming SSE da pipeline
 * 
 * Responsável por:
 * - Receber requisições de stream da pipeline
 * - Converter eventos PipelineEvent para formato SSE
 * - Manter conexão aberta com cliente
 * 
 * (responsável pelo streaming) implementará:
 * - PipelineOrchestratorStream
 * - Emissão de eventos com as interfaces definidas
 */
@ApiTags('Petições')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('peticao')
export class PeticaoStreamController {
  constructor() {}

  /**
   * Stream SSE da pipeline de análise
   * 
   * GET /peticao/:id/stream
   * 
   * Abre uma conexão HTTP permanente que envia eventos em tempo real
   * conforme a pipeline processa a petição.
   * 
   * Eventos que serão recebidos:
   * - extraction: texto extraído
   * - nlp: processamento NLP concluído
   * - embedding: embeddings gerados
   * - search: 150 precedentes encontrados
   * - synthesis: síntese de cada precedente (múltiplos)
   * - summary: resumo final
   * - complete: pipeline concluída com sucesso
   * - error: erro em qualquer etapa
   * 
   * @param id ID da petição a analisar
   * @returns Observable com eventos SSE
   * 
   * @example
   * // Cliente JavaScript
   * const source = new EventSource('/peticao/123/stream');
   * 
   * source.addEventListener('search', (e) => {
   *   const data = JSON.parse(e.data);
   *   console.log(`Encontrados ${data.data.totalFound} precedentes`);
   * });
   * 
   * source.addEventListener('synthesis', (e) => {
   *   const data = JSON.parse(e.data);
   *   console.log(`Síntese do precedente ${data.data.precedentId} pronta`);
   * });
   * 
   * source.addEventListener('complete', (e) => {
   *   source.close();
   * });
   */
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
    /**
     * ⚠️ IMPORTANTE: Seu amigo precisa implementar PipelineOrchestratorStream
     * 
     * Este método espera que exista:
     * - Injetar PipelineOrchestratorStream no constructor
     * - Chamar this.pipelineOrchestrator.runWithStreaming(id)
     * - Este método retorna Observable<PipelineEvent>
     * 
     * Exemplo de implementação futura:
     * ```
     * constructor(
     *   private readonly pipelineOrchestrator: PipelineOrchestratorStream,
     * ) {}
     * 
     * return this.pipelineOrchestrator.runWithStreaming(id)
     *   .pipe(
     *     map((event: PipelineEvent) => ({
     *       id: `${event.stage}_${Date.now()}`,
     *       type: event.stage,
     *       data: JSON.stringify(event),
     *       retry: 5000,
     *     }))
     *   );
     * ```
     */

    /**
     * Placeholder: Vai ser implementado quando PipelineOrchestratorStream estiver pronto
     */
    return new Observable<MessageEvent>((observer) => {
      // Este observable será alimentado por PipelineOrchestratorStream
      // Convertendo PipelineEvent em MessageEvent (formato SSE)
      observer.error(
        new Error(
          'PipelineOrchestratorStream não foi injetado. Seu amigo precisa implementar a classe.',
        ),
      );
    });
  }
}
