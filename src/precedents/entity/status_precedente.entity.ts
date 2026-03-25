import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('status_precedente')
export class StatusPrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 512, nullable: true })
  nome: string;

  // @OneToMany(() => PrecedenteEntity, (precedente) => precedente.status)
  // precedente: PrecedenteEntity[];
}
