import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';
import PecaEntity from './peca.entity';

@Entity('tipo_peca')
export default class TipoPecaEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @OneToMany(() => PecaEntity, (peca) => peca.tipo_peca)
  pecas: PecaEntity[];
}
