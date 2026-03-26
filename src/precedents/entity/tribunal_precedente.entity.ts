import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';
import { Exclude } from 'class-transformer';
import PrecedenteEntity from './precedente.entity';

@Entity('tribunal_precedente')
export class TribunalPrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 512, nullable: true })
  nome: string;

  @Column({ length: 512, nullable: true })
  sigla: string;

  @Exclude()
  @OneToMany(() => PrecedenteEntity, (precedente) => precedente.tribunal)
  precedente: PrecedenteEntity[];
}
