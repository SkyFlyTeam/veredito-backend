import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserEntity } from '../../account/user/entity/user.entity';
import { TribunalPrecedenteEntity } from '../../precedents/entity/tribunal_precedente.entity';
import { CasoPrecedenteSugeridoEntity } from './caso_precedente_sugerido.entity';
import { SecoesPeticaoEntity } from './secoes_peticao.entity';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('caso_juridico')
export class CasoJuridicoEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  area_direito: string;

  @Column({ type: 'text' })
  pedidos_principais: string;

  @Column({ type: 'text' })
  tese_pretendida: string;

  @Column({ type: 'char', length: 2 })
  uf: string;

  @Column({ type: 'text', nullable: true })
  fundamentos_juridicos: string;

  @Column({ type: 'text', nullable: true })
  fatos_estruturados: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'tribunal_precedente_id', nullable: true })
  tribunalPrecedenteId: number;

  @ManyToOne(() => UserEntity, (user) => user.casosJuridicos)
  @JoinColumn({ name: 'usuario_id' })
  usuario: UserEntity;

  @Column({ name: 'secoes_peticao_id', nullable: true })
  secoesPeticaoId: number;

  @ManyToOne(() => SecoesPeticaoEntity, (secoesPeticao) => secoesPeticao.casosJuridicos, { nullable: true })
  @JoinColumn({ name: 'secoes_peticao_id' })
  secoesPeticao: SecoesPeticaoEntity;

  @ManyToOne(() => TribunalPrecedenteEntity, { nullable: true })
  @JoinColumn({ name: 'tribunal_precedente_id' })
  tribunal_precedente?: TribunalPrecedenteEntity;

  @Exclude()
  @OneToMany(
    () => CasoPrecedenteSugeridoEntity,
    (casoPrecedente: CasoPrecedenteSugeridoEntity) => casoPrecedente.casoJuridico,
  )
  precedentesSugeridos: CasoPrecedenteSugeridoEntity[];
}
