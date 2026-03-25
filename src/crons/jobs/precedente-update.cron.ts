/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

import { EspeciePrecedenteEntity } from 'src/precedents/entity/especie_precedente.entity';
import PrecedenteEntity from 'src/precedents/entity/precedente.entity';
import { StatusPrecedenteEntity } from 'src/precedents/entity/status_precedente.entity';
import { TribunalPrecedenteEntity } from 'src/precedents/entity/tribunal_precedente.entity';

@Injectable()
export class PrecedenteUpdateService {
  private readonly logger = new Logger(PrecedenteUpdateService.name);

  private isRunning = false;

  constructor(
    @InjectRepository(PrecedenteEntity)
    private readonly precedenteRepo: Repository<PrecedenteEntity>,

    @InjectRepository(EspeciePrecedenteEntity)
    private readonly especieRepo: Repository<EspeciePrecedenteEntity>,

    @InjectRepository(StatusPrecedenteEntity)
    private readonly statusRepo: Repository<StatusPrecedenteEntity>,

    @InjectRepository(TribunalPrecedenteEntity)
    private readonly tribunalRepo: Repository<TribunalPrecedenteEntity>,
  ) {}

  @Cron('10 3 * * *')
  handleCron() {
    return this.executeJob();
  }

  async executeJob() {
    if (this.isRunning) {
      this.logger.warn('Job already running, skipping...');
      return;
    }

    this.isRunning = true;

    const start = Date.now();

    try {
      this.logger.log('Starting precedentes update job...');

      // 🔹 Load base data (single queries)
      const [tribunais, especies, statuses, existentes] = await Promise.all([
        this.tribunalRepo.find(),
        this.especieRepo.find(),
        this.statusRepo.find(),
        this.precedenteRepo.find(),
      ]);

      // 🔹 Build maps
      const tribunalMap = new Map(tribunais.map((t) => [t.sigla, t]));
      const especieMap = new Map(especies.map((e) => [e.sigla, e]));
      const precedenteMap = new Map(
        existentes.map((p) => [p.numero_registro, p]),
      );

      const statusList = statuses;

      const tribunalSiglas = tribunais.map((t) => t.sigla);
      const especieSiglas = especies.map((e) => e.sigla);

      const PAGE_SIZE = 10;
      let currentPage = 1;
      let totalPages = 1;

      const precedentesToSave: PrecedenteEntity[] = [];

      let created = 0;
      let updated = 0;

      do {
        this.logger.log(`Fetching page ${currentPage}...`);

        const response = await axios.post(
          'https://pangeabnp.pdpj.jus.br/api/v1/precedentes',
          {
            filtro: {
              buscaGeral: '',
              cancelados: false,
              ordenacao: 'Text',
              orgaos: tribunalSiglas,
              pagina: currentPage,
              quaisquerPalavras: '',
              semPalavras: '',
              tipos: especieSiglas,
              todasPalavras: '',
              trechoExato: '',
            },
          },
          { timeout: 10000 },
        );

        const data = response.data;

        // 🔹 First page: calculate total pages
        if (currentPage === 1) {
          const total = data.total;
          totalPages = Math.ceil(total / PAGE_SIZE);

          this.logger.log(
            `Total registros: ${total} | Total páginas: ${totalPages}`,
          );
        }

        // 🛑 Safety: stop if empty
        if (!data.resultados || data.resultados.length === 0) {
          this.logger.warn(`Empty page ${currentPage}, stopping early`);
          break;
        }

        // 🔹 Process each precedente
        for (const p of data.resultados) {
          let entity = precedenteMap.get(p.id);

          const situacao = p.situacao?.toLowerCase();

          let resolvedStatus = statusList.find((s) =>
            situacao?.includes(s.nome.toLowerCase()),
          );

          if (!resolvedStatus) {
            resolvedStatus = statusList.find((s) => s.nome === 'desconhecido');
          }

          const tribunal = tribunalMap.get(p.orgao);
          const especie = especieMap.get(p.tipo);

          if (entity) {
            // 🔁 UPDATE
            entity.ultima_atualizacao = new Date();
            entity.tese = p?.tese || null;
            entity.tese_vetor = p?.highlights?.tese || null;
            entity.questao_vetor = p?.highlights?.questao || null;
            entity.tribunal = tribunal;
            entity.especie = especie;
            entity.status = resolvedStatus;

            updated++;
          } else {
            // 🆕 CREATE
            entity = this.precedenteRepo.create({
              numero_registro: p.id,
              ultima_atualizacao: new Date(),
              tese: p?.tese || null,
              tese_vetor: p?.highlights?.tese || null,
              questao_vetor: p?.highlights?.questao || null,
              tribunal,
              especie,
              status: resolvedStatus,
            });

            created++;
          }

          precedentesToSave.push(entity);
        }

        currentPage++;
      } while (currentPage <= totalPages);

      // 🔹 Batch save (chunked)
      const BATCH_SIZE = 100;

      for (let i = 0; i < precedentesToSave.length; i += BATCH_SIZE) {
        const batch = precedentesToSave.slice(i, i + BATCH_SIZE);
        await this.precedenteRepo.save(batch);
      }

      const duration = ((Date.now() - start) / 1000).toFixed(2);

      this.logger.log(
        `Job finished | Created: ${created} | Updated: ${updated} | Total: ${precedentesToSave.length} | Time: ${duration}s`,
      );
    } catch (error) {
      this.logger.error('Error updating precedentes:', error.stack);
    } finally {
      this.isRunning = false;
    }
  }
}
