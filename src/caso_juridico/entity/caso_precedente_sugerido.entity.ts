import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { CasoJuridicoEntity } from './caso_juridico.entity';
import PrecedenteEntity from '../../precedents/entity/precedente.entity';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('caso_precedente_sugerido')
export class CasoPrecedenteSugeridoEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'caso_juridico_id' })
  casoJuridicoId: number;

  @Column({ name: 'precedente_id' })
  precedenteId: number;

  @Exclude()
  @ManyToOne(() => CasoJuridicoEntity, (caso) => caso.precedentesSugeridos)
  @JoinColumn({ name: 'caso_juridico_id' })
  casoJuridico: CasoJuridicoEntity;

  @ManyToOne(() => PrecedenteEntity)
  @JoinColumn({ name: 'precedente_id' })
  precedente: PrecedenteEntity;
}
