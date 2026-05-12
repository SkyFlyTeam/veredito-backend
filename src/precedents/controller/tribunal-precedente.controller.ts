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
import { TribunalPrecedenteService } from '../service/tribunal-precedente.service';
import { CreateTribunalPrecedenteDto } from '../dto/create-tribunal-precedente.dto';
import { Roles } from 'src/account/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/account/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/account/auth/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('tribunal-precedente')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Tribunais de Precedentes')
@ApiBearerAuth('access-token')
export class TribunalPrecedenteController {
  constructor(
    private readonly tribunalPrecedenteService: TribunalPrecedenteService,
  ) {}

  @Post()
  @Roles('superuser')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTribunalPrecedenteDto) {
    return this.tribunalPrecedenteService.create(dto);
  }

  @Get()
  @Roles('advogado', 'juiz', 'superuser')
  findAll() {
    return this.tribunalPrecedenteService.findAll();
  }

  @Get(':id')
  @Roles('advogado', 'juiz', 'superuser')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tribunalPrecedenteService.findOne(id);
  }

  @Put(':id')
  @Roles('superuser')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTribunalPrecedenteDto,
  ) {
    return this.tribunalPrecedenteService.update(id, dto);
  }

  @Delete(':id')
  @Roles('superuser')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tribunalPrecedenteService.delete(id);
  }
}
