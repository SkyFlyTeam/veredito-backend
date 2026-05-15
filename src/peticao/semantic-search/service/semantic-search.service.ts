/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PrecedenteEntity from 'src/precedents/entity/precedente.entity';
import { Repository } from 'typeorm';
import { FiltrosDto } from 'src/peticao/dto/filtros.dto';

@Injectable()
export class SemanticSearchService {
  constructor(
    @InjectRepository(PrecedenteEntity)
    private readonly precedenteRepo: Repository<PrecedenteEntity>,
  ) {}

  async searchSimilar(embedding: number[], filtros?: FiltrosDto) {
    const vector = JSON.stringify(embedding);
    const params: unknown[] = [vector];
    let paramIndex = 2;
    let filterClauses = '';

    if (filtros?.tribunais && filtros.tribunais.length > 0) {
      filterClauses += ` AND p.tribunal_id = ANY($${paramIndex}::int[])`;
      params.push(filtros.tribunais);
      paramIndex++;
    }

    if (filtros?.especies && filtros.especies.length > 0) {
      filterClauses += ` AND p.especie_id = ANY($${paramIndex}::int[])`;
      params.push(filtros.especies);
      paramIndex++;
    }

    const result = await this.precedenteRepo.query(
      `
        SELECT
          p.id,
          p.numero_registro,
          p.tese,
          p.questao,
          p.ultima_atualizacao,
          p.status_id,
          p.tribunal_id,
          p.especie_id,
          sp.nome as status_nome,
          tp.nome as tribunal_nome,
          ep.nome as especie_nome,
          tp.sigla as tribunal_sigla,
          ep.nome as especie_nome,
          ep.sigla as especie_sigla,
          1 - LEAST(
            COALESCE(p.tese_vetor <=> $1::vector, 1),
            COALESCE(p.questao_vetor <=> $1::vector, 1)
          ) AS score
        FROM precedente p
        LEFT JOIN status_precedente sp ON p.status_id = sp.id
        LEFT JOIN tribunal_precedente tp ON p.tribunal_id = tp.id
        LEFT JOIN especie_precedente ep ON p.especie_id = ep.id
        WHERE (p.tese_vetor IS NOT NULL
           OR p.questao_vetor IS NOT NULL)${filterClauses}
        ORDER BY score DESC
        LIMIT 10;
      `,
      params,
    );

    const unique = new Map();
    for (const p of result) {
      if (!unique.has(p.numero_registro)) {
        unique.set(p.numero_registro, p);
      }
    }

    return Array.from(unique.values()).slice(0, 10);
  }
}
