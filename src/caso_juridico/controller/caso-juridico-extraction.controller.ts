/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// .originalname
/* eslint-disable @typescript-eslint/no-unsafe-return */
// return cb(...)

import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  Body,
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
import { CasoJuridicoExtractionService } from '../service/caso-juridico-extraction.service';
import { CasoJuridicoInformations } from '../dto/caso-juridico-informations.dto';

const { memoryStorage } = require('multer');

@ApiTags('Caso Jurídico — Extração de Documentos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('caso-juridico')
export class CasoJuridicoExtractionController {
  constructor(
    private readonly extractionService: CasoJuridicoExtractionService,
  ) {}

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
          description:
            'Contexto fático e fundamentos jurídicos',
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

    return this.extractionService.extractFromDocuments(
      files,
      contexto_fatico_fundamentos,
    );
  }
}
