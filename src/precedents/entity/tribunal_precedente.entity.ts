import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import PrecedenteEntity from './precedente.entity';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('tribunal_precedente')
export class TribunalPrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 10 })
  sigla: string;

  @OneToMany(() => PrecedenteEntity, (precedente) => precedente.tribunal)
  precedente: PrecedenteEntity[];
}
