import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from 'src/account/account.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PeticaoModule } from './peticao/peticao.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false, // dev only!
    }),

    AccountModule,
    UserModule,
    AuthModule,
    PeticaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
