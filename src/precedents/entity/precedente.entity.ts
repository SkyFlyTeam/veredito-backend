import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PrecedenteSugeridoEntity } from './precedente_sugerido.entity';
import { StatusPrecedenteEntity } from './status_precedente.entity';
import { TribunalPrecedenteEntity } from './tribunal_precedente.entity';
import { EspeciePrecedenteEntity } from './especie_precedente.entity';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('precedente')
export default class PrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  numero_registro: string;

  @Column({ type: 'text', nullable: true })
  tese: string;

  @Column({ type: 'timestamp' })
  ultima_atualizacao: Date;

  @Column({ type: 'text', nullable: true })
  tese_vetor: string;

  @Column({ type: 'text', nullable: true })
  questao_vetor: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @OneToMany(
    () => PrecedenteSugeridoEntity,
    (precedenteSugerido) => precedenteSugerido.precedente,
  )
  precedenteSugerido: PrecedenteSugeridoEntity[];

  @ManyToOne(() => StatusPrecedenteEntity, { nullable: true })
  @JoinColumn({ name: 'status_id' })
  status?: StatusPrecedenteEntity;

  @ManyToOne(() => TribunalPrecedenteEntity, { nullable: true })
  @JoinColumn({ name: 'tribunal_id' })
  tribunal?: TribunalPrecedenteEntity;

  @ManyToOne(() => EspeciePrecedenteEntity, { nullable: true })
  @JoinColumn({ name: 'especie_id' })
  especie?: EspeciePrecedenteEntity;
}
