import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../account/user/entity/user.entity';

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
}
