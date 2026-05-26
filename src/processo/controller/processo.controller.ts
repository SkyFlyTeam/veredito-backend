/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Body,
  Delete,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
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
import { CreateProcessoDTO } from '../dtos/processo.dto';
import { ProcessoService } from '../service/processo.service';
import { ProcessoResponseDTO } from '../dtos/processo-response.dto';
import { MinutaSentencaDto } from '../dtos/minuta-sentenca.dto';
import { MinutaSentencaService } from '../service/minuta-sentenca.service';

const processoFileInterceptorOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/processos/';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
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
};

@ApiTags('Processos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('processo')
@ApiBearerAuth('access-token')
export class ProcessoController {
  constructor(
    private readonly textSearchPartsService: TextSearchPartsService,
    private readonly processoService: ProcessoService,
    private readonly minutaSentencaService: MinutaSentencaService,
  ) { }

  @Get()
  @Roles('juiz', 'superuser')
  @ApiOperation({ summary: 'Listar todos os processos jurídicos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de processos jurídicos retornada com sucesso',
    type: [ProcessoResponseDTO],
  })
  findAll(): Promise<ProcessoResponseDTO[]> {
    return this.processoService.findAll();
  }

  @Get(':id')
  @Roles('juiz', 'superuser')
  @ApiOperation({ summary: 'Obter um processo jurídico pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Processo jurídico retornado com sucesso',
    type: ProcessoResponseDTO,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProcessoResponseDTO> {
    return this.processoService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', processoFileInterceptorOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProcessoDTO })
  @ApiOperation({ summary: 'Criar um novo processo jurídico' })
  @ApiResponse({
    status: 201,
    description: 'Processo jurídico criado',
    type: ProcessoResponseDTO,
  })
  @Roles('superuser', 'juiz')
  async createProcesso(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() body: CreateProcessoDTO,
  ): Promise<ProcessoResponseDTO> {
    const usuarioId = req.user?.id || req.user?.userId;
    if (!usuarioId) {
      throw new BadRequestException('Usuário não autenticado');
    }

    return this.processoService.create({ ...body, file: file.path }, usuarioId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover um processo jurídico' })
  @ApiResponse({
    status: 204,
    description: 'Processo jurídico removido',
  })
  @Roles('superuser', 'juiz')
  async deleteProcesso(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.processoService.delete(id);
  }

  @Post('parts')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', processoFileInterceptorOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPeticaoDto })
  @ApiOperation({ summary: 'Fazer upload de um processo jurídico' })
  @ApiResponse({
    status: 201,
    description: 'Processo jurídico analizado e partes identificadas',
  })
  @Roles('superuser', 'juiz')
  async searchPeticao(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    return await this.textSearchPartsService.searchPeticaoInicial(file);
  }

  @Post('contestacao')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/processos/contestacao';
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
  @Roles('superuser', 'juiz')
  async searchContestacao(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    return await this.textSearchPartsService.searchContestacao(file);
  }

  @Post('sentenca')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/processos/sentenca';
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
  @Roles('superuser', 'juiz')
  async searchSentenca(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    return await this.textSearchPartsService.searchSentenca(file);
  }

  @Post('recursos')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/processos/sentenca';
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
  @Roles('superuser', 'juiz')
  async searchRecurso(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    return await this.textSearchPartsService.searchRecurso(file);
  }
  @Post('minuta-sentenca')
  @HttpCode(201)
  @ApiOperation({ summary: 'Gerar minuta de sentença em formato DOCX' })
  @ApiResponse({
    status: 201,
    description: 'Documento Word (.docx) gerado com a minuta da sentença',
  })
  @Roles('superuser', 'juiz')
  async gerarMinutaSentenca(
    @Body() body: MinutaSentencaDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.minutaSentencaService.gerarMinutaSentenca(body);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="minuta_sentenca.docx"',
    });

    return new StreamableFile(buffer);
  }
}
