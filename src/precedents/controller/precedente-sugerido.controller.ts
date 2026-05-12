import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PrecedenteSugeridoService } from '../service/precedente_sugerido.service';
import { CreatePrecedenteSugeridoDto } from '../dto/create-precedente-sugerido.dto';
import { UpdatePrecedenteSugeridoDto } from '../dto/update-precedente-sugerido.dto';
import { Roles } from 'src/account/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/account/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/account/auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('precedente-sugerido')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Precedentes Sugeridos')
@ApiBearerAuth('access-token')
export class PrecedenteSugeridoController {
  constructor(
    private readonly precedenteSugeridoService: PrecedenteSugeridoService,
  ) {}

  @Post()
  @Roles('superuser')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePrecedenteSugeridoDto) {
    return this.precedenteSugeridoService.create(dto);
  }

  @Get()
  @Roles('advogado', 'juiz', 'superuser')
  findAll() {
    return this.precedenteSugeridoService.findAll();
  }

  @Get(':id')
  @Roles('advogado', 'juiz', 'superuser')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.precedenteSugeridoService.findOne(id);
  }

  @Put()
  @Roles('advogado', 'juiz', 'superuser')
  update(@Body() dto: UpdatePrecedenteSugeridoDto) {
    return this.precedenteSugeridoService.update(dto.id, dto);
  }

  @Delete(':id')
  @Roles('superuser')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.precedenteSugeridoService.delete(id);
  }
}
