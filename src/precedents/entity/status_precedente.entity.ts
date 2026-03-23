import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import PrecedenteEntity from './precedente.entity';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('status_precedente')
export class StatusPrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @OneToMany(() => PrecedenteEntity, (precedente) => precedente.status)
  precedente: PrecedenteEntity[];
}
