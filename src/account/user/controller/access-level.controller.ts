import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/account/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/account/auth/guards/roles.guard';
import { AccessLevelService } from '../service/access-level.service';
import { AccessLevelEntity } from '../entity/access-level.entity';

@Controller('access-level')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Access Levels')
@ApiBearerAuth('access-token')
export class AccessLevelController {
  constructor(private readonly accessLevelService: AccessLevelService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os níveis de acesso (exceto superuser)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de níveis de acesso retornada com sucesso',
    type: [AccessLevelEntity],
  })
  findAll(): Promise<AccessLevelEntity[]> {
    return this.accessLevelService.findAll();
  }
}
