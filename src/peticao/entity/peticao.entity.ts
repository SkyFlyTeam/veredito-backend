import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../../account/user/entity/user.entity';
import { PrecedenteSugeridoEntity } from '../../precedents/entity/precedente_sugerido.entity';

@Entity('peticao')
export class PeticaoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'caminho_arquivo' })
  caminhoArquivo: string;

  @Column({ nullable: true })
  resumo: string;

  @Column({ name: 'tese_vetor', nullable: true })
  teseVetor: string;

  @Column({ name: 'questao_vetor', nullable: true })
  questaoVetor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @ManyToOne(() => UserEntity, (user) => user.peticoes)
  @JoinColumn({ name: 'usuario_id' })
  user: UserEntity;

  @OneToMany(
    () => PrecedenteSugeridoEntity,
    (precedenteSugerido) => precedenteSugerido.peticao,
  )
  precedenteSugerido: PrecedenteSugeridoEntity[];
}
