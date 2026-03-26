import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';
import { Exclude } from 'class-transformer';
import PrecedenteEntity from './precedente.entity';

@Entity('status_precedente')
export class StatusPrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 512, nullable: true })
  nome: string;

  @Exclude()
  @OneToMany(() => PrecedenteEntity, (precedente) => precedente.status)
  precedente: PrecedenteEntity[];
}
