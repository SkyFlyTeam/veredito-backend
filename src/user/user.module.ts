import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { AccessLevelEntity } from './entity/access-level.entity';
import { UsersController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { AccessLevelSeed } from './seed/access-level.seed';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AccessLevelEntity])],
  providers: [UserService, AccessLevelSeed],
  controllers: [UsersController],
  exports: [UserService],
})
export class UserModule {}
