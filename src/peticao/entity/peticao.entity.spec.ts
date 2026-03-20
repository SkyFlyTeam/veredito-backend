import { PeticaoEntity } from './peticao.entity';

describe('PeticaoEntity', () => {
  it('should be defined', () => {
    const entity = new PeticaoEntity();
    expect(entity).toBeDefined();
  });

  it('should allow setting properties', () => {
    const entity = new PeticaoEntity();
    entity.id = 1;
    entity.caminhoArquivo = 'path/to/file.pdf';
    entity.resumo = 'Resumo';
    entity.teseVetor = 'tese';
    entity.questaoVetor = 'questao';
    entity.createdAt = new Date();
    entity.usuarioId = 1;

    expect(entity.id).toBe(1);
    expect(entity.caminhoArquivo).toBe('path/to/file.pdf');
    expect(entity.resumo).toBe('Resumo');
    expect(entity.teseVetor).toBe('tese');
    expect(entity.questaoVetor).toBe('questao');
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.usuarioId).toBe(1);
  });
});
