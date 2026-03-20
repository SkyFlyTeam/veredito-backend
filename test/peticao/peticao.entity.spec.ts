import { describe, expect, it } from '@jest/globals';
import { PeticaoEntity } from '../../src/peticao/entity/peticao.entity';

describe('PeticaoEntity', () => {
  it('should be defined', () => {
    const entity = new PeticaoEntity();
    expect(entity).toBeDefined();
  });

  it('should allow setting properties', () => {
    const entity = new PeticaoEntity();
    const now = new Date();
    entity.id = 1;
    entity.caminhoArquivo = 'path/to/file.pdf';
    entity.resumo = 'Resumo';
    entity.teseVetor = 'tese';
    entity.questaoVetor = 'questao';
    entity.createdAt = now;
    entity.usuarioId = 1;

    expect(entity.id).toBe(1);
    expect(entity.caminhoArquivo).toBe('path/to/file.pdf');
    expect(entity.resumo).toBe('Resumo');
    expect(entity.teseVetor).toBe('tese');
    expect(entity.questaoVetor).toBe('questao');
    expect(entity.createdAt).toBe(now);
    expect(entity.usuarioId).toBe(1);
  });
});
