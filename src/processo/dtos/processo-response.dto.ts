import DTOInterface from 'src/interfaces/dto.interface';

export class ProcessoResponseDTO extends DTOInterface {
  id: number;
  caminhoArquivo: string;
  instancia: number | null;
  classeProcessual: string | null;
  areaDireito: string | null;
  createdAt: Date;
  peticaoId: number | null;
  tribunalPrecedenteId: number | null;
}