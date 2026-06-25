/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseGuards,
  BadRequestException,
  Body,
  UploadedFiles,
  UseInterceptors,
  Delete,
  Req,
  Sse,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../account/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../account/auth/guards/roles.guard';
import { Roles } from '../../account/auth/decorators/roles.decorator';
import { CasoJuridicoService } from '../service/caso-juridico.service';
import { CasoJuridicoExtractionService } from '../service/caso-juridico-extraction.service';
import { CasoJuridicoInformations } from '../dto/caso-juridico-informations.dto';
import { CasoJuridicoCrudService } from '../service/caso-juridico-crud.service';
import { CreateCasoJuridicoDto } from '../dto/caso-juridico.dto';
import { CasoJuridicoResponseDto } from '../dto/caso-juridico-response.dto';
import { SecoesPeticaoEntity } from '../entity/secoes_peticao.entity';
import { AnaliseCasoJuridicoDto } from '../dto/analise-caso-juridico.dto';
import { PdfGeneratorService } from '../service/pdf-generator.service';
import { CasoJuridicoPipelineOrchestrator } from '../pipeline-services/caso_juridico_pipeline_orchestror';
import { CasoJuridicoPipelineEvent } from '../pipeline-services/types/caso-juridico-pipeline-event.type';
import { UpdateSecaoPeticaoDto } from '../dto/update-secao-peticao.dto';

@ApiTags('Casos Jurídicos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('caso-juridico')
export class CasoJuridicoController {
  constructor(
    private readonly casoJuridicoService: CasoJuridicoService,
    private readonly extractionService: CasoJuridicoExtractionService,
    private readonly casoJuridicoCrudService: CasoJuridicoCrudService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly casoJuridicoPipelineOrchestrator: CasoJuridicoPipelineOrchestrator,
  ) {}

  @Post()
  @Roles('advogado', 'superuser')
  @HttpCode(201)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      fileFilter: (
        _req: unknown,
        file: { originalname: string },
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!file.originalname.match(/\.(pdf|docx|txt)$/i)) {
          return cb(
            new BadRequestException(
              `Arquivo "${file.originalname}" rejeitado. Apenas .pdf, .docx e .txt são permitidos.`,
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB por arquivo
        files: 3,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Dados do caso jurídico + documentos (PDF, DOCX ou TXT)',
    schema: {
      type: 'object',
      required: [
        'area_direito',
        'pedidos_principais',
        'tese_pretendida',
        'uf',
        'contexto_fatico_fundamentos',
        'tribunalPrecedenteId',
        'files',
      ],
      properties: {
        area_direito: {
          type: 'string',
          example: 'Direito do Trabalho',
        },
        pedidos_principais: {
          type: 'string',
          example: 'Indenização por danos morais',
        },
        tese_pretendida: {
          type: 'string',
          example: 'Responsabilidade civil do empregador',
        },
        uf: {
          type: 'string',
          example: 'SP',
        },
        contexto_fatico_fundamentos: {
          type: 'string',
          example:
            'O contrato de trabalho foi rescindido sem pagamento das verbas rescisórias. Arts. 477 e 483 da CLT; art. 186 CC.',
        },
        tribunalPrecedenteId: {
          type: 'number',
          example: 1,
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Criar novo caso jurídico',
    description:
      'Recebe os dados do caso e até 3 documentos jurídicos (PDF, DOCX ou TXT). ' +
      'Os documentos são processados pelo serviço de extração junto com o contexto fático e fundamentos informados pelo advogado para gerar os fatos ' +
      'estruturados e fundamentos jurídicos automaticamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Caso jurídico criado com sucesso',
    type: CasoJuridicoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou arquivo em formato não permitido',
  })
  async create(
    @Body() dto: CreateCasoJuridicoDto,
    @UploadedFiles() files: any[],
    @Req() req: any,
  ): Promise<CasoJuridicoResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Envie ao menos um documento no campo "files".',
      );
    }

    const usuarioIdRaw = req.user?.id || req.user?.userId || req.user?.sub;
    const usuarioId = Number(usuarioIdRaw);
    if (!usuarioIdRaw || Number.isNaN(usuarioId)) {
      throw new BadRequestException('Usuário não autenticado.');
    }

    return this.casoJuridicoCrudService.create(dto, files, usuarioId);
  }

  @Get()
  @Roles('advogado')
  @ApiOperation({ summary: 'Listar todos os casos jurídicos' })
  @ApiResponse({
    status: 200,
    description: 'Lista retornada com sucesso',
    type: [CasoJuridicoResponseDto],
  })
  findAll(): Promise<CasoJuridicoResponseDto[]> {
    return this.casoJuridicoCrudService.findAll();
  }

  @Post(':id/stream')
  @Roles('advogado', 'superuser')
  @Sse()
  @HttpCode(200)
  @ApiOperation({ summary: 'Analisar caso jurídico com stream SSE' })
  @ApiBody({ type: AnaliseCasoJuridicoDto })
  @ApiResponse({
    status: 200,
    description: 'Stream SSE da análise do caso jurídico',
  })
  async streamPipeline(
    @Param('id', ParseIntPipe) _id: number,
    @Body() _dto: AnaliseCasoJuridicoDto,
  ): Promise<Observable<MessageEvent>> {
    const mockedCasoJuridico =
      await this.casoJuridicoService.getMockedResponseForCasoJuridico();

    return this.toSseEvents(
      this.casoJuridicoPipelineOrchestrator.replayCasoJuridicoAnalysis(
        mockedCasoJuridico.id,
      ),
    );
  }

  private toSseEvents(
    events: Observable<CasoJuridicoPipelineEvent>,
  ): Observable<MessageEvent> {
    return events.pipe(
      map(
        (event: CasoJuridicoPipelineEvent) =>
          ({
            type: event.stage,
            data: JSON.stringify(event),
            retry: 5000,
          }) as unknown as MessageEvent,
      ),
    );
  }

  @Get(':id')
  @Roles('advogado')
  @ApiOperation({ summary: 'Buscar caso jurídico por ID' })
  @ApiResponse({
    status: 200,
    description: 'Caso jurídico retornado com sucesso',
    type: CasoJuridicoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Caso jurídico não encontrado',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CasoJuridicoResponseDto> {
    return this.casoJuridicoCrudService.findOne(id);
  }

  @Delete(':id')
  @Roles('advogado')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar caso jurídico por ID' })
  @ApiResponse({
    status: 204,
    description: 'Caso jurídico deletado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Caso jurídico não encontrado',
  })
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.casoJuridicoCrudService.delete(id);
  }

  @Post(':id/gerar-peticao')
  @Roles('advogado', 'superuser')
  @ApiOperation({
    summary: 'Gerar petição inicial para um caso jurídico',
    description:
      'Carrega as informações do caso e utiliza o modelo LLM para gerar as seções "Dos Fatos" e "Dos Pedidos".',
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

  @Patch(':id/:secaoId')
  @Roles('advogado', 'superuser')
  @ApiOperation({
    summary: 'Editar o conteudo de uma secao da peticao',
    description:
      'Atualiza o conteudo de uma secao de peticao vinculada ao caso juridico.',
  })
  @ApiBody({ type: UpdateSecaoPeticaoDto })
  @ApiResponse({
    status: 200,
    description: 'Secao atualizada com sucesso',
    type: SecoesPeticaoEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Caso juridico ou secao nao encontrada',
  })
  async atualizarSecaoPeticao(
    @Param('id', ParseIntPipe) id: number,
    @Param('secaoId', ParseIntPipe) secaoId: number,
    @Body() dto: UpdateSecaoPeticaoDto,
  ): Promise<SecoesPeticaoEntity> {
    return this.casoJuridicoService.updateSecaoPeticao(id, secaoId, dto);
  }

  @Post('extrair-documentos')
  @Roles('advogado', 'juiz', 'superuser')
  @HttpCode(200)
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
      fileFilter: (_req: any, file: any, cb: any) => {
        if (!file.originalname.match(/\.(pdf|docx|txt)$/i)) {
          return cb(
            new BadRequestException(
              `Arquivo "${file.originalname}" rejeitado. ` +
                'Apenas arquivos .pdf, .docx e .txt são permitidos.',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024,
        files: 20,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Um ou mais documentos jurídicos (PDF, DOCX ou TXT)',
    schema: {
      type: 'object',
      properties: {
        contexto_fatico_fundamentos: {
          type: 'string',
          description: 'Contexto fático e fundamentos jurídicos',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Extrai fatos estruturados e fundamentos jurídicos de documentos',
    description:
      'Recebe múltiplos arquivos jurídicos (decisões, contratos, procurações, ' +
      'documentos probatórios, petições) e utiliza GPT-4o para identificar ' +
      'os fatos relevantes e os fundamentos jurídicos aplicáveis ao caso.',
  })
  @ApiResponse({
    status: 200,
    description: 'Extração realizada com sucesso',
    type: CasoJuridicoInformations,
  })
  @ApiResponse({
    status: 400,
    description: 'Nenhum arquivo enviado ou formato inválido',
  })
  @ApiResponse({
    status: 415,
    description: 'Nenhum documento jurídico válido pôde ser processado',
  })
  async extrairDocumentos(
    @UploadedFiles() files: any[],
    @Body('contexto_fatico_fundamentos') contexto_fatico_fundamentos: string,
  ): Promise<CasoJuridicoInformations> {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Envie ao menos um arquivo no campo "files".',
      );
    }

    if (
      contexto_fatico_fundamentos === null ||
      contexto_fatico_fundamentos === undefined ||
      (typeof contexto_fatico_fundamentos === 'string' &&
        contexto_fatico_fundamentos.trim() === '')
    ) {
      throw new BadRequestException(
        'O campo "contexto_fatico_fundamentos" é obrigatório e não pode ser null/empty.',
      );
    }

    const invalidFile = files.some(
      (f) => !f || !f.originalname || String(f.originalname).trim() === '',
    );
    if (invalidFile) {
      throw new BadRequestException(
        'Um ou mais arquivos enviados possuem nome inválido ou estão vazios. Verifique o campo "files".',
      );
    }

    return this.extractionService.extractFromDocuments(
      files,
      contexto_fatico_fundamentos,
    );
  }

  @Get(':id/download-peticao')
  @HttpCode(200)
  @Roles('advogado', 'superuser')
  @ApiOperation({
    summary: 'Baixar a minuta de petição inicial como PDF',
    description:
      'Retorna a minuta de petição inicial do caso jurídico formatada em um arquivo PDF pronto para download.',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Arquivo PDF da petição inicial gerado com sucesso',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Caso jurídico não encontrado ou sem petição gerada',
  })
  async downloadPeticao(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const { caso, secoes } =
      await this.casoJuridicoService.obterSecoesPeticao(id);

    if (!secoes || secoes.length === 0) {
      throw new NotFoundException(
        `Nenhuma seção de petição encontrada para o caso ${id}. Gere a petição primeiro via POST /:id/gerar-peticao.`,
      );
    }

    const casoInfo = {
      uf: caso.uf,
      area_direito: caso.area_direito,
      tese_pretendida: caso.tese_pretendida,
    };

    const pdfBuffer = await this.pdfGeneratorService.gerarPeticaoPdf(
      secoes,
      casoInfo,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="peticao_caso_${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
