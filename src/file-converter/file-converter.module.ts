import { Module } from '@nestjs/common';
import { FileConverterController } from './controller/file-converter.controller';
import { FileConverterService } from './service/file-converter.service';

@Module({
  controllers: [FileConverterController],
  providers: [FileConverterService],
  exports: [FileConverterService],
})
export class FileConverterModule {}
