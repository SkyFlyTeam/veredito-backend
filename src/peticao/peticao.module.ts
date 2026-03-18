import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeticaoEntity } from './entity/peticao.entity';
import { PeticaoService } from './service/peticao.service';
import { PeticaoController } from './controller/peticao.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PeticaoEntity])],
  controllers: [PeticaoController],
  providers: [PeticaoService],
  exports: [PeticaoService],
})
export class PeticaoModule {}
