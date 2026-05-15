import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/account/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/account/auth/guards/roles.guard';
import { TextSearchPartsService } from '../service/text-search-parts.service';
import { Roles } from 'src/account/auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { UploadPeticaoDto } from 'src/peticao/dto/upload-peticao.dto';

@ApiTags('Processos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('processo')
@ApiBearerAuth('access-token')
export class ProcessoController {
  constructor(
    private readonly textSearchPartsService: TextSearchPartsService,
  ) {}

  @Post('parts')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/processos/';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const sanitizedOriginalName = file.originalname.replace(/\s+/g, '_');
          cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|docx|txt)$/i)) {
          return cb(
            new BadRequestException(
              'Apenas arquivos .pdf, .docx e .txt são permitidos',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 300 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPeticaoDto })
  @ApiOperation({ summary: 'Fazer upload de um processo jurídico' })
  @ApiResponse({
    status: 201,
    description: 'Processo jurídico analizado e partes identificadas',
  })
  @Roles('superuser')
  async searchPeticao(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    return this.textSearchPartsService.searchPeticaoInicial(file);
  }
}
