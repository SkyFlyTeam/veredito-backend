/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// update-model.service.ts
import axios from 'axios';
import { Repository } from 'typeorm';
import { EspeciePrecedenteEntity } from '../../precedents/entity/especie_precedente.entity';
import { TribunalPrecedenteEntity } from '../../precedents/entity/tribunal_precedente.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UpdateEspecieTribunalService {
  private readonly logger = new Logger(UpdateEspecieTribunalService.name);

  constructor(
    @InjectRepository(EspeciePrecedenteEntity)
    private readonly especieRepo: Repository<EspeciePrecedenteEntity>,

    @InjectRepository(TribunalPrecedenteEntity)
    private readonly tribunalRepo: Repository<TribunalPrecedenteEntity>,
  ) {}

  @Cron('0 3 * * *')
  async handleCron() {
    this.logger.log(
      'Starting cron job to update model especie and tribunal...',
    );

    try {
      const response = await axios.get(
        'https://pangeabnp.pdpj.jus.br/api/v1/parametros',
      );

      const data = response.data;

      for (const e of data.especies) {
        const especie = await this.especieRepo.findOneBy({ sigla: e.sigla });
        if (especie) {
          especie.nome = e.descricao;
          await this.especieRepo.save(especie);
        } else {
          const newEspecie = this.especieRepo.create({
            sigla: e.sigla,
            nome: e.descricao,
          });
          await this.especieRepo.save(newEspecie);
        }
      }

      for (const t of data.orgaos) {
        const tribunal = await this.tribunalRepo.findOneBy({ sigla: t.sigla });
        if (tribunal) {
          tribunal.nome = t.descricao;
          await this.tribunalRepo.save(tribunal);
        } else {
          const newTribunal = this.tribunalRepo.create({
            sigla: t.sigla,
            nome: t.descricao,
          });
          await this.tribunalRepo.save(newTribunal);
        }
      }

      this.logger.log('Cron job completed successfully');
    } catch (error) {
      this.logger.error('Error running cron job', error.stack);
    }
  }
}
