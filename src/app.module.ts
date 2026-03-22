import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from 'src/account/account.module';
import { PeticaoModule } from './peticao/peticao.module';
import { FileConverterModule } from './file-converter/file-converter.module';

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
    PeticaoModule,
    FileConverterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
