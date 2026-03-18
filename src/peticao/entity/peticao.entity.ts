import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

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
}
