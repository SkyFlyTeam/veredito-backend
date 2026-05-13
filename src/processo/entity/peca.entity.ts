import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import EntityInterface from 'src/interfaces/entity.interface';
import TipoPecaEntity from './tipo_peca.entity';
import ProcessoJuridicoEntity from './processo_juridico.entity';

@Entity('peca')
export default class PecaEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ name: 'pagina_inicial', type: 'int' })
  pagina_inicial: number;

  @ManyToOne(() => TipoPecaEntity, (tipoPeca) => tipoPeca.pecas)
  @JoinColumn({ name: 'tipo_peca_id' })
  tipo_peca: TipoPecaEntity;

  @ManyToOne(() => ProcessoJuridicoEntity, (processo) => processo.pecas)
  @JoinColumn({ name: 'processo_juridico' })
  processo_juridico: ProcessoJuridicoEntity;
}
