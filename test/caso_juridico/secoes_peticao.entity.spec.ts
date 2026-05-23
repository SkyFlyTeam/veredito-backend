import { describe, expect, it } from '@jest/globals';
import { SecoesPeticaoEntity } from '../../src/caso_juridico/entity/secoes_peticao.entity';
import { CasoJuridicoEntity } from '../../src/caso_juridico/entity/caso_juridico.entity';

describe('SecoesPeticaoEntity', () => {
  it('should be defined', () => {
    const entity = new SecoesPeticaoEntity();
    expect(entity).toBeDefined();
  });

  it('should allow setting properties', () => {
    const entity = new SecoesPeticaoEntity();
    entity.id = 1;
    entity.titulo = 'Dos Fatos';
    entity.conteudo = 'Conteúdo da seção detalhando os fatos do caso.';
    entity.casoJuridicoId = 1;

    const casoJuridico = new CasoJuridicoEntity();
    casoJuridico.id = 1;
    entity.casoJuridico = casoJuridico;

    expect(entity.id).toBe(1);
    expect(entity.titulo).toBe('Dos Fatos');
    expect(entity.conteudo).toBe('Conteúdo da seção detalhando os fatos do caso.');
    expect(entity.casoJuridicoId).toBe(1);
    expect(entity.casoJuridico).toBe(casoJuridico);
    expect(entity.casoJuridico.id).toBe(1);
  });
});
