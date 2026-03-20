import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccessLevelEntity } from './access-level.entity';
import { PeticaoEntity } from '../../../peticao/entity/peticao.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 100 })
  sobrenome: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'senha', type: 'bytea' })
  password: Buffer;

  @ManyToOne(() => AccessLevelEntity, (accessLevel) => accessLevel.users, {
    eager: true, // auto load relation
  })
  @JoinColumn({ name: 'access_level_id' })
  accessLevel: AccessLevelEntity;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => PeticaoEntity, (peticao) => peticao.user)
  peticoes: PeticaoEntity[];
}
