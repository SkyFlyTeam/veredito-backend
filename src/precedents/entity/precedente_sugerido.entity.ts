import { Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import PrecedenteEntity from './precedente.entity';
import { PeticaoEntity } from './preticao.entity';
import EntityInterface from 'src/interfaces/entity.interface';

export class PrecedenteSugeridoEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  percentual_similaridade: number;

  @Column()
  classificacao: number;

  @Column({ length: 500 })
  sintese_explicativa: string;

  @ManyToOne(() => PrecedenteEntity, (precedente) => precedente.id)
  @JoinColumn({ name: 'precedente_id' })
  precedente: PrecedenteEntity;

  @ManyToOne(() => PeticaoEntity, (peticao) => peticao.id)
  @JoinColumn({ name: 'peticao_id' })
  peticao: PeticaoEntity;
}
