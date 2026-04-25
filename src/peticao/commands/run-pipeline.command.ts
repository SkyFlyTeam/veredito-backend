/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import * as fs from 'fs';
import * as path from 'path';
import { Command, CommandRunner } from 'nest-commander';
import { PeticaoService } from '../service/peticao.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../account/user/entity/user.entity';
import { Repository } from 'typeorm';
import { PipelineOrchestrator } from '../pipeline-services/pipeline_orchestror';
import { PipelineEvent } from '../dto/pipeline-event.dto';

const DATA_DIR = path.resolve(process.cwd(), 'dev-tools', 'data');

const MIMETYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

@Command({
  name: 'run:pipeline',
  arguments: '<filename>',
  description:
    'Run the full streaming NLP pipeline on a file from dev-tools/data/',
})
export class RunPipelineCommand extends CommandRunner {
  constructor(
    private readonly orchestratorStream: PipelineOrchestrator,
    private readonly peticaoService: PeticaoService,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const filename = inputs[0];

    const filePath = path.isAbsolute(filename)
      ? filename
      : path.resolve(DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const originalname = path.basename(filePath);
    const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
    const mimetype = MIMETYPE_MAP[ext] ?? 'application/octet-stream';

    const sep = (char = '─', w = 80) => console.log(char.repeat(w));

    sep('═');
    console.log(`FILE: ${originalname}`);
    console.log(`MIMETYPE: ${mimetype}`);
    sep('═');

    console.log('\n[INFO] Registering petition in database...');

    let user = await this.userRepository.findOne({ where: { id: 1 } });

    if (!user) {
      user = await this.userRepository.findOne({ where: {} });
    }

    if (!user) {
      console.error(
        '[ERROR] No users found in database. Please create a user first.',
      );
      process.exit(1);
    }

    await this.peticaoService.create(filePath, user.id);

    const allPeticoes = await this.peticaoService.findAll();

    const peticao =
      allPeticoes.find((p) => p.caminhoArquivo === filePath) ||
      allPeticoes[allPeticoes.length - 1];

    if (!peticao) {
      console.error('[ERROR] Could not find created petition.');
      process.exit(1);
    }

    console.log(
      `[INFO] Running streaming pipeline for Petição ID: ${peticao.id}...`,
    );
    sep();

    await new Promise<void>((resolve, reject) => {
      this.orchestratorStream.run(peticao.id).subscribe({
        next: (event: PipelineEvent) => {
          this.printEvent(event);
        },
        error: (error) => {
          console.error('[STREAM ERROR]', error);
          reject(error);
        },
        complete: () => {
          console.log('\n[ANALYSIS COMPLETED SUCCESSFULLY]');
          resolve();
        },
      });
    });
  }

  private printEvent(event: PipelineEvent): void {
    const duration = event.duration ? `${event.duration}ms` : 'N/A';

    console.log(
      `\n[${event.stage.toUpperCase()}] ${event.status} | ${duration}`,
    );

    switch (event.stage) {
      case 'search':
        console.log(`Total found: ${event.data.totalFound}`);
        console.log(
          `Average similarity score: ${event.data.averageSimilarityScore}`,
        );
        break;

      case 'synthesis':
        console.log(
          `Precedente ID: ${event.data.precedente?.id ?? event.data.precedente_id ?? 'N/A'}`,
        );
        console.log(`Classificação: ${event.data.classificacao ?? 'N/A'}`);
        console.log(
          `Similaridade: ${event.data.percentual_similaridade ?? 'N/A'}%`,
        );
        console.log(`Síntese: ${event.data.sintese_explicativa ?? 'N/A'}`);
        break;

      case 'resumo':
        console.log(event.data.resumo);
        break;

      case 'complete':
        console.log(`Total duration: ${event.data.totalDurationMs}ms`);
        console.log(`Precedents processed: ${event.data.precedentsProcessed}`);
        console.log(`Synthesis generated: ${event.data.synthesisGenerated}`);
        break;

      case 'error':
        console.error(`Failed stage: ${event.data.failedStage}`);
        console.error(`Message: ${event.data.message}`);
        console.error(`Recoverable: ${event.data.recoverable}`);
        break;

      default:
        console.log(JSON.stringify(event.data, null, 2));
    }
  }
}
