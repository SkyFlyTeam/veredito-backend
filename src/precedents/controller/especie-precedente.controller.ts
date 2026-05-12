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
import { EspeciePrecedenteService } from '../service/especie-precedente.service';
import { CreateEspeciePrecedenteDto } from '../dto/create-especie-precedente.dto';
import { Roles } from 'src/account/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/account/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/account/auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('especie-precedente')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Especies de Precedentes')
@ApiBearerAuth('access-token')
export class EspeciePrecedenteController {
  constructor(
    private readonly especiePrecedenteService: EspeciePrecedenteService,
  ) {}

  @Post()
  @Roles('superuser')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEspeciePrecedenteDto) {
    return this.especiePrecedenteService.create(dto);
  }

  @Get()
  @Roles('advogado', 'juiz', 'superuser')
  findAll() {
    return this.especiePrecedenteService.findAll();
  }

  @Get(':id')
  @Roles('advogado', 'juiz', 'superuser')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.especiePrecedenteService.findOne(id);
  }

  @Put(':id')
  @Roles('superuser')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEspeciePrecedenteDto,
  ) {
    return this.especiePrecedenteService.update(id, dto);
  }

  @Delete(':id')
  @Roles('superuser')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.especiePrecedenteService.delete(id);
  }
}
