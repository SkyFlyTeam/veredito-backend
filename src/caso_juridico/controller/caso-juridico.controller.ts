import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  BadRequestException,
  HttpCode,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Delete,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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

@ApiTags('Casos Jurídicos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('caso-juridico')
export class CasoJuridicoController {
  constructor(
    private readonly casoJuridicoService: CasoJuridicoService,
    private readonly extractionService: CasoJuridicoExtractionService,
    private readonly casoJuridicoCrudService: CasoJuridicoCrudService,
  ) {}

  @Post()
  @Roles('advogado')
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
        'fatos_estruturados',
        'fundamentos_juridicos',
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
        fatos_estruturados: {
          type: 'string',
          example:
            'O contrato de trabalho foi rescindido sem pagamento das verbas rescisórias.',
        },
        fundamentos_juridicos: {
          type: 'string',
          example: 'Arts. 477 e 483 da CLT; art. 186 CC.',
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
      'Os documentos são processados pelo serviço de extração junto com os fatos e fundamentos informados pelo advogado para gerar os fatos ' +
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
}
