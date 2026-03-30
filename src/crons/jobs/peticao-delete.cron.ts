import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeticaoEntity } from 'src/peticao/entity/peticao.entity';
import { PeticaoService } from 'src/peticao/service/peticao.service';

@Injectable()
export class PeticaoDeleteCronService implements OnModuleInit {
    // Cron to delete peticoes that are older than 2 hours and have no associated precedenteSugerido (was not analyzed)
	private static readonly CRON_EXPRESSION = '0 */2 * * *'; // Runs every two hours

	private readonly logger = new Logger(PeticaoDeleteCronService.name);

	constructor(
		@InjectRepository(PeticaoEntity)
		private readonly peticaoRepo: Repository<PeticaoEntity>,
		private readonly peticaoService: PeticaoService,
	) {}

	onModuleInit() {
		this.logger.log(
			`Peticao cleanup cron registered with expression: ${PeticaoDeleteCronService.CRON_EXPRESSION}`,
		);
	}

	@Cron(PeticaoDeleteCronService.CRON_EXPRESSION)
	async handleCron() {
		const cutoffDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

		try {
			this.logger.log('Starting stale peticao cleanup job...');

			const stalePeticoes = await this.peticaoRepo
				.createQueryBuilder('peticao')
				.leftJoin('peticao.precedenteSugerido', 'precedenteSugerido')
				.select('peticao.id', 'id')
				.addSelect('peticao.caminhoArquivo', 'caminhoArquivo')
				.where('peticao.createdAt <= :cutoffDate', { cutoffDate })
				.groupBy('peticao.id')
				.addGroupBy('peticao.caminhoArquivo')
				.having('COUNT(precedenteSugerido.id) = 0')
				.getRawMany<{ id: number; caminhoArquivo: string }>();

			if (stalePeticoes.length === 0) {
				this.logger.log('No stale peticoes found for deletion.');
				return;
			}

			const result = await this.peticaoService.deleteManyWithFiles(stalePeticoes);

			this.logger.log(
				`Stale peticao cleanup finished. Deleted: ${result.deleted}. File delete failures: ${result.fileDeleteFailures}`,
			);
		} catch (error) {
			this.logger.error('Error running stale peticao cleanup job', error.stack);
		}
	}
}
