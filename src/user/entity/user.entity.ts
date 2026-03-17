import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AccessLevelEntity } from './access-level.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => AccessLevelEntity, (accessLevel) => accessLevel.users, {
    eager: true, // auto load relation
  })
  @JoinColumn({ name: 'access_level_id' })
  accessLevel: AccessLevelEntity;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
