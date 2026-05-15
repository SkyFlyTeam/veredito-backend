import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TipoPecaEntity from '../entity/tipo_peca.entity';
import { TipoPecaEnumerator } from '../enumerator/tipo-peca.enumerator';

@Injectable()
export class TipoPecaSeed implements OnModuleInit {
  constructor(
    @InjectRepository(TipoPecaEntity)
    private readonly tipoPecaRepository: Repository<TipoPecaEntity>,
  ) {}

  async onModuleInit() {
    const defaultTipos = Object.values(TipoPecaEnumerator);

    for (const tipo of defaultTipos) {
      const exists = await this.tipoPecaRepository.findOne({
        where: { nome: tipo },
      });

      if (!exists) {
        await this.tipoPecaRepository.save(
          this.tipoPecaRepository.create({ nome: tipo }),
        );
        console.log(`Tipo de peça '${tipo}' criado`);
      }
    }
  }
}
