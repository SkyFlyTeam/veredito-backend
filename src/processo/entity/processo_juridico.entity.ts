import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';
import { UserEntity } from 'src/account/user/entity/user.entity';
import { PeticaoEntity } from 'src/peticao/entity/peticao.entity';
import { TribunalPrecedenteEntity } from 'src/precedents/entity/tribunal_precedente.entity';
import PecaEntity from './peca.entity';

@Entity('processo_juridico')
export default class ProcessoJuridicoEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 250 })
  caminho_arquivo: string;

  @Column({ type: 'int', nullable: true })
  instancia: number;

  @Column({ name: 'classe_processual', type: 'varchar', length: 100, nullable: true })
  classe_processual: string;

  @Column({ name: 'area_direito', type: 'varchar', length: 150, nullable: true })
  area_direito: string;

  @Column({ name: 'pedidos', type: 'text', nullable: true })
  pedidos: string;

  @Column({ name: 'fundamentos', type: 'text', nullable: true })
  fundamentos: string;

  @Column({ name: 'fatos', type: 'text', nullable: true })
  fatos: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: UserEntity;

  @ManyToOne(() => PeticaoEntity, { nullable: true })
  @JoinColumn({ name: 'peticao_id' })
  peticao?: PeticaoEntity;

  @ManyToOne(() => TribunalPrecedenteEntity, { nullable: true })
  @JoinColumn({ name: 'tribunal_precedente' })
  tribunal_precedente?: TribunalPrecedenteEntity;

  @OneToMany(() => PecaEntity, (peca) => peca.processo_juridico)
  pecas: PecaEntity[];
}