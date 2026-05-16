import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessLevelService } from '../service/access-level.service';
import { AccessLevelEntity } from '../entity/access-level.entity';

@Controller('access-level')
@ApiTags('Access Levels')
export class AccessLevelController {
  constructor(private readonly accessLevelService: AccessLevelService) { }

  @Get()
  @ApiOperation({ summary: 'Listar todos os cargos (exceto superuser)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos retornada com sucesso',
    type: [AccessLevelEntity],
  })
  findAll(): Promise<AccessLevelEntity[]> {
    return this.accessLevelService.findAll();
  }
}
