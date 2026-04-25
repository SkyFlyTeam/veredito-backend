/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  Sse,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PeticaoService } from '../service/peticao.service';
import { PeticaoResponseDTO } from '../dto/peticao-response.dto';
import { JwtAuthGuard } from '../../account/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../account/auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { UploadPeticaoDto } from '../dto/upload-peticao.dto';
import { PipelineOrchestrator } from '../pipeline-services/pipeline_orchestror';
import { PrecedenteSugeridoService } from '../../precedents/service/precedente_sugerido.service';
import { PipelineEvent } from '../dto/pipeline-event.dto';

@ApiTags('Petições')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('peticao')
export class PeticaoController {
  constructor(
    private readonly peticaoService: PeticaoService,
    private readonly orchestrator: PipelineOrchestrator,
    private readonly precedenteSugeridoService: PrecedenteSugeridoService,
  ) {}

  @Post('upload')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/peticoes/';
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
  @ApiOperation({ summary: 'Fazer upload de uma nova petição' })
  @ApiResponse({
    status: 201,
    description: 'Petição criada com sucesso',
    type: PeticaoResponseDTO,
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<PeticaoResponseDTO> {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const usuarioId = req.user?.id || req.user?.userId;
    if (!usuarioId) {
      throw new BadRequestException('Usuário não autenticado');
    }

    return this.peticaoService.create(file.path, usuarioId);
  }

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
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PeticaoResponseDTO> {
    return this.peticaoService.findOne(id);
  }

  @Get(':id/stream')
  @Sse()
  @HttpCode(200)
  streamPipeline(
    @Param('id', ParseIntPipe) id: number,
  ): Observable<MessageEvent> {
    return this.orchestrator.run(id).pipe(
      map(
        (event: PipelineEvent) =>
          ({
            type: event.stage,
            data: JSON.stringify(event),
            retry: 5000,
          }) as unknown as MessageEvent,
      ),
    );
  }
}
