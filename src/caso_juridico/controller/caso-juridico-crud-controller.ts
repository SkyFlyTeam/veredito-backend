/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../account/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../account/auth/guards/roles.guard';
import { Roles } from '../../account/auth/decorators/roles.decorator';
import { CasoJuridicoCrudService } from '../service/caso-juridico-crud.service';
import { CreateCasoJuridicoDto } from '../dto/caso-juridico.dto';
import { CasoJuridicoResponseDto } from '../dto/caso-juridico-response.dto';

const { memoryStorage } = require('multer');

@ApiTags('Casos Jurídicos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('caso-juridico')
export class CasoJuridicoCrudController {
  constructor(private readonly casoJuridicoCrudService: CasoJuridicoCrudService) {}

  @Post()
  @Roles('advogado')
  @HttpCode(201)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: memoryStorage(),
      fileFilter: (_req: any, file: any, cb: any) => {
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
      required: ['area_direito', 'pedidos_principais', 'tese_pretendida', 'uf', 'files'],
      properties: {
        area_direito: { type: 'string', example: 'Direito do Trabalho' },
        pedidos_principais: { type: 'string', example: 'Indenização por danos morais' },
        tese_pretendida: { type: 'string', example: 'Responsabilidade civil do empregador' },
        uf: { type: 'string', example: 'SP' },
        tribunalPrecedenteId: { type: 'number', example: 1 },
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
      'Os documentos são processados pelo serviço de extração para gerar os fatos ' +
      'estruturados e fundamentos jurídicos automaticamente.',
  })
  @ApiResponse({ status: 201, description: 'Caso jurídico criado com sucesso', type: CasoJuridicoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou arquivo em formato não permitido' })
  async create(
    @Body() dto: CreateCasoJuridicoDto,
    @UploadedFiles() files: any[],
    @Req() req: any,
  ): Promise<CasoJuridicoResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Envie ao menos um documento no campo "files".');
    }

    const usuarioId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!usuarioId) {
      throw new BadRequestException('Usuário não autenticado.');
    }

    return this.casoJuridicoCrudService.create(dto, files, usuarioId);
  }

  @Get()
  @Roles('advogado')
  @ApiOperation({ summary: 'Listar todos os casos jurídicos' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso', type: [CasoJuridicoResponseDto] })
  findAll(): Promise<CasoJuridicoResponseDto[]> {
    return this.casoJuridicoCrudService.findAll();
  }

  @Get(':id')
  @Roles('advogado')
  @ApiOperation({ summary: 'Buscar caso jurídico por ID' })
  @ApiResponse({ status: 200, description: 'Caso jurídico retornado com sucesso', type: CasoJuridicoResponseDto })
  @ApiResponse({ status: 404, description: 'Caso jurídico não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CasoJuridicoResponseDto> {
    return this.casoJuridicoCrudService.findOne(id);
  }

  @Delete(':id')
  @Roles('advogado')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar caso jurídico por ID' })
  @ApiResponse({ status: 204, description: 'Caso jurídico deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Caso jurídico não encontrado' })
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.casoJuridicoCrudService.delete(id);
  }
}
