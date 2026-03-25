import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('tribunal_precedente')
export class TribunalPrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 512, nullable: true })
  nome: string;

  @Column({ length: 512, nullable: true })
  sigla: string;

  // @OneToMany(() => PrecedenteEntity, (precedente) => precedente.tribunal)
  // precedente: PrecedenteEntity[];
}
