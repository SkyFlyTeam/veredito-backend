import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/account/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/account/auth/guards/roles.guard';

@Controller('precedente')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Precedentes')
@ApiBearerAuth('access-token')
export class PrecedenteController {}
