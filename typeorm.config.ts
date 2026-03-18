import 'dotenv/config';
import { DataSource } from 'typeorm';
<<<<<<< HEAD
import { UserEntity } from './src/account/user/entity/user.entity';
import { AccessLevelEntity } from './src/account/user/entity/access-level.entity';
=======
import { UserEntity } from './src/user/entity/user.entity';
import { AccessLevelEntity } from './src/user/entity/access-level.entity';
import { PeticaoEntity } from './src/peticao/entity/peticao.entity';
>>>>>>> c9bf537 (VER-4 feat: adicionar entidade peticao)

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [UserEntity, AccessLevelEntity, PeticaoEntity],
  migrations: ['src/migrations/*.ts'],
});
