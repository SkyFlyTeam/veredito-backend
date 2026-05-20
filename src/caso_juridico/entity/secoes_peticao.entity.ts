import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CasoJuridicoEntity } from './caso_juridico.entity';
import EntityInterface from 'src/interfaces/entity.interface';

@Entity('secoes_peticao')
export class SecoesPeticaoEntity implements EntityInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  titulo: string;

  @Column({ type: 'text' })
  conteudo: string;

  @OneToMany(
    () => CasoJuridicoEntity,
    (casoJuridico) => casoJuridico.secoesPeticao,
  )
  casosJuridicos: CasoJuridicoEntity[];
}
