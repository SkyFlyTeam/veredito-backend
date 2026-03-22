import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ALLOWED_EXTENSIONS,
  FileConverterService,
} from '../service/file-converter.service';
import { memoryStorage } from 'multer';

@UseGuards(JwtAuthGuard)
@ApiTags('File Converter')
@ApiBearerAuth('access-token')
@Controller('file-converter')
export class FileConverterController {
  constructor(private readonly fileConverterService: FileConverterService) {}

  @Post('parse')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: `Arquivo a ser convertido. Formatos aceitos: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async parseFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ text: string }> {
    const text = await this.fileConverterService.extractText(file);
    return { text };
  }
}
