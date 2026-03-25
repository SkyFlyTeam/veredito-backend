import 'dotenv/config';
import { DataSource } from 'typeorm';
import { UserEntity } from './src/account/user/entity/user.entity';
import { AccessLevelEntity } from './src/account/user/entity/access-level.entity';
import { PeticaoEntity } from './src/peticao/entity/peticao.entity';
import PrecedenteEntity from './src/precedents/entity/precedente.entity';
import { PrecedenteSugeridoEntity } from './src/precedents/entity/precedente_sugerido.entity';
import { EspeciePrecedenteEntity } from './src/precedents/entity/especie_precedente.entity';
import { StatusPrecedenteEntity } from './src/precedents/entity/status_precedente.entity';
import { TribunalPrecedenteEntity } from './src/precedents/entity/tribunal_precedente.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    UserEntity,
    AccessLevelEntity,
    PeticaoEntity,
    PrecedenteEntity,
    PrecedenteSugeridoEntity,
    EspeciePrecedenteEntity,
    StatusPrecedenteEntity,
    TribunalPrecedenteEntity,
  ],
  migrations: ['src/migrations/*.ts'],
});
