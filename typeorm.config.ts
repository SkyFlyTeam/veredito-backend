import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ExemploEntity } from './src/exemplo/entity/exemplo.entity';
import { UserEntity } from './src/user/entity/user.entity';
import { AccessLevelEntity } from './src/user/entity/access-level.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [ExemploEntity, UserEntity, AccessLevelEntity],
  migrations: ['src/migrations/*.ts'],
});
