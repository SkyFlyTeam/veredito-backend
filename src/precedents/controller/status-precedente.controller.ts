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
import { StatusPrecedenteService } from '../service/status-precedente.service';
import { CreateStatusPrecedenteDto } from '../dto/create-status-precedente.dto';
import { Roles } from 'src/account/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/account/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/account/auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('status-precedente')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Status de Precedentes')
@ApiBearerAuth('access-token')
export class StatusPrecedenteController {
  constructor(
    private readonly statusPrecedenteService: StatusPrecedenteService,
  ) {}

  @Post()
  @Roles('superuser')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStatusPrecedenteDto) {
    return this.statusPrecedenteService.create(dto);
  }

  @Get()
  @Roles('superuser')
  findAll() {
    return this.statusPrecedenteService.findAll();
  }

  @Get(':id')
  @Roles('superuser')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.statusPrecedenteService.findOne(id);
  }

  @Put(':id')
  @Roles('superuser')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateStatusPrecedenteDto,
  ) {
    return this.statusPrecedenteService.update(id, dto);
  }

  @Delete(':id')
  @Roles('superuser')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.statusPrecedenteService.delete(id);
  }
}
