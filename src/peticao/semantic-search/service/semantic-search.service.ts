/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PrecedenteEntity from 'src/precedents/entity/precedente.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SemanticSearchService {
  constructor(
    @InjectRepository(PrecedenteEntity)
    private readonly precedenteRepo: Repository<PrecedenteEntity>,
  ) { }

  async searchSimilar(embedding: number[]) {
    const vector = JSON.stringify(embedding);

    const result = await this.precedenteRepo.query(
      `
        SELECT 
          p.*,
          LEAST(
            COALESCE(p.tese_vetor <-> $1, 1),
            COALESCE(p.questao_vetor <-> $1, 1)
          ) AS score
        FROM precedente p
        WHERE p.tese_vetor IS NOT NULL 
           OR p.questao_vetor IS NOT NULL
        ORDER BY score ASC
        LIMIT 10;
        `,
      [vector],
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
