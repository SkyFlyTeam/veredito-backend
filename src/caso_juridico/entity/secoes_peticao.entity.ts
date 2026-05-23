import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { CasoJuridicoEntity } from './caso_juridico.entity';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('secoes_peticao')
export class SecoesPeticaoEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({ name: 'caso_juridico_id' })
  casoJuridicoId: number;

  @ManyToOne(
    () => CasoJuridicoEntity,
    (casoJuridico) => casoJuridico.secoesPeticao,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'caso_juridico_id' })
  casoJuridico: CasoJuridicoEntity;
}
