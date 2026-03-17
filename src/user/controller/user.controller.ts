import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Roles('superuser')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
