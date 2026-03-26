import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';
import { Exclude } from 'class-transformer';
import PrecedenteEntity from './precedente.entity';

@Entity('especie_precedente')
export class EspeciePrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 512, nullable: true })
  nome: string;

  @Column({ length: 512, nullable: true })
  sigla: string;

  @Exclude()
  @OneToMany(() => PrecedenteEntity, (precedente) => precedente.especie)
  precedente: PrecedenteEntity[];
}
