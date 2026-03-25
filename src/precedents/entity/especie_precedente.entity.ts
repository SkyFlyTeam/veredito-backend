import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('especie_precedente')
export class EspeciePrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 512, nullable: true })
  nome: string;

  @Column({ length: 512, nullable: true })
  sigla: string;

  // @OneToMany(() => PrecedenteEntity, (precedente) => precedente.especie)
  // precedente: PrecedenteEntity[];
}
