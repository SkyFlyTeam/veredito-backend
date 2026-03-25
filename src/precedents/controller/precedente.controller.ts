import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/account/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/account/auth/guards/roles.guard';
import { PrecedenteService } from '../service/precedente.service';
import { CreatePrecedenteDto } from '../dto/create-precedente.dto';
import { UpdatePrecedenteDto } from '../dto/update-precedente.dto';
import { Roles } from 'src/account/auth/decorators/roles.decorator';

@Controller('precedente')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Precedentes')
@ApiBearerAuth('access-token')
export class PrecedenteController {
  constructor(private readonly precedenteService: PrecedenteService) {}

  @Post()
  @Roles('superuser')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePrecedenteDto) {
    return this.precedenteService.create(dto);
  }

  @Get(':id')
  @Roles('superuser')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.precedenteService.findOne(id);
  }

  @Get()
  @Roles('superuser')
  findAll() {
    return this.precedenteService.findAll();
  }

  @Put()
  @Roles('superuser')
  update(@Body() dto: UpdatePrecedenteDto) {
    return this.precedenteService.update(dto.id, dto);
  }

  @Delete(':id')
  @Roles('superuser')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.precedenteService.delete(id);
  }
}
