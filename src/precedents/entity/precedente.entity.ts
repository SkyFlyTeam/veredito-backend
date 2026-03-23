import {
  Column,
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

export default class PrecedenteEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numero_registro: number;

  @Column()
  tese: string;

  @Column({ type: 'datetime' })
  ultima_atualizacao: Date;

  @Column({ type: 'text' })
  tese_vetor: string;

  @Column({ type: 'text' })
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

  @ManyToOne(() => StatusPrecedenteEntity, (status) => status.precedente)
  @JoinColumn({ name: 'status_id' })
  status: StatusPrecedenteEntity;

  @ManyToOne(() => TribunalPrecedenteEntity, (tribunal) => tribunal.precedente)
  @JoinColumn({ name: 'tribunal_id' })
  tribunal: TribunalPrecedenteEntity;

  @ManyToOne(() => EspeciePrecedenteEntity, (especie) => especie.precedente)
  @JoinColumn({ name: 'especie_id' })
  especie: EspeciePrecedenteEntity;
}
