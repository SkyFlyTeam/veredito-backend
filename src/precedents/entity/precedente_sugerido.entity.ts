import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import PrecedenteEntity from './precedente.entity';
import EntityInterface from 'src/interfaces/entity.interface';
import { PeticaoEntity } from 'src/peticao/entity/peticao.entity';

@Entity('precedente_sugerido')
export class PrecedenteSugeridoEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentual_similaridade: number;

  @Column()
  classificacao: number;

  @Column({ length: 1000 })
  sintese_explicativa: string;

  @Column({ name: 'precedente_id' })
  precedenteId: number;

  @Column({ name: 'peticao_id' })
  peticaoId: number;

  @ManyToOne(() => PrecedenteEntity, (precedente) => precedente.id)
  @JoinColumn({ name: 'precedente_id' })
  precedente: PrecedenteEntity;

  @Exclude()
  @ManyToOne(() => PeticaoEntity, (peticao) => peticao.id)
  @JoinColumn({ name: 'peticao_id' })
  peticao: PeticaoEntity;
}
