import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('access_levels')
export class AccessLevelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nome: string;

  @OneToMany(() => UserEntity, (user) => user.accessLevel)
  users: UserEntity[];
}
