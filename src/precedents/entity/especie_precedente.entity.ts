import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import PrecedenteEntity from './precedente.entity';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('especie_precedente')
export class EspeciePrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 10 })
  sigla: string;

  @OneToMany(() => PrecedenteEntity, (precedente) => precedente.especie)
  precedente: PrecedenteEntity[];
}
