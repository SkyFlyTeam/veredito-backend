import { Module } from '@nestjs/common';
import { SynthesisService } from './synthesis.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [SynthesisService],
  exports: [SynthesisService],
})
export class SynthesisModule {}
