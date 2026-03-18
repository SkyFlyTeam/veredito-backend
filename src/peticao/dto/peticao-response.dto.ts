import DTOInterface from 'src/interfaces/dto.interface';

export class PeticaoResponseDTO extends DTOInterface {
  id: number;
  caminhoArquivo: string;
  resumo?: string;
  createdAt: Date;
  usuarioId: number;
}
