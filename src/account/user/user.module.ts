import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { AccessLevelEntity } from './entity/access-level.entity';
import { UsersController } from './controller/user.controller';
import { AccessLevelController } from './controller/access-level.controller';
import { UserService } from './service/user.service';
import { AccessLevelService } from './service/access-level.service';
import { AccessLevelSeed } from './seed/access-level.seed';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AccessLevelEntity])],
  providers: [UserService, AccessLevelService, AccessLevelSeed],
  controllers: [UsersController, AccessLevelController],
  exports: [UserService],
})
export class UserModule {}
