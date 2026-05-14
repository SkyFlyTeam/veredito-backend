/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as fs from 'fs';
import * as path from 'path';
import { Command, CommandRunner } from 'nest-commander';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeticaoService } from '../service/peticao.service';
import { PipelineOrchestrator } from '../pipeline-services/pipeline_orchestror';
import { PipelineEvent } from '../dto/pipeline-event.dto';
import { UserEntity } from '../../account/user/entity/user.entity';

const DATA_DIR = path.resolve(process.cwd(), 'dev-tools', 'data');

@Command({
  name: 'run:pipeline:batch',
  description:
    'Run the full streaming NLP pipeline for all PDF files in dev-tools/data/',
})
export class RunPipelineBatchCommand extends CommandRunner {
  constructor(
    private readonly orchestratorStream: PipelineOrchestrator,
    private readonly peticaoService: PeticaoService,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  async run(): Promise<void> {
    const files = this.getPdfFiles();

    if (files.length === 0) {
      console.error(`[ERROR] No PDF files found in ${DATA_DIR}`);
      process.exit(1);
    }

    const user = await this.findUser();

    if (!user) {
      console.error(
        '[ERROR] No users found in database. Please create a user first.',
      );
      process.exit(1);
    }

    this.sep('═');
    console.log(`BATCH FILES: ${files.length}`);
    console.log(`DATA DIR: ${DATA_DIR}`);
    console.log(`USER ID: ${user.id}`);
    this.sep('═');

    const successes: string[] = [];
    const failures: Array<{ file: string; reason: string }> = [];

    for (const [index, filePath] of files.entries()) {
      const filename = path.basename(filePath);

      this.sep();
      console.log(`[${index + 1}/${files.length}] ${filename}`);

      try {
        const peticao = await this.peticaoService.create(filePath, user.id);
        console.log(`[INFO] Petição registrada com ID ${peticao.id}`);

        const result = await this.runPipeline(peticao.id);

        if (result.success) {
          successes.push(filename);
          console.log(`[OK] Pipeline concluída para ${filename}`);
          continue;
        }

        failures.push({
          file: filename,
          reason: result.reason || 'Pipeline finalizada sem evento complete',
        });
        console.error(`[FAIL] ${filename}: ${result.reason}`);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'Unknown batch error';
        failures.push({ file: filename, reason });
        console.error(`[FAIL] ${filename}: ${reason}`);
      }
    }

    this.sep('═');
    console.log('BATCH SUMMARY');
    this.sep('═');
    console.log(`Processed: ${files.length}`);
    console.log(`Successes: ${successes.length}`);
    console.log(`Failures: ${failures.length}`);

    if (failures.length > 0) {
      console.log();
      console.log('Failed files:');
      for (const failure of failures) {
        console.log(`- ${failure.file}: ${failure.reason}`);
      }
      process.exitCode = 1;
    }
  }

  private getPdfFiles(): string[] {
    return fs
      .readdirSync(DATA_DIR)
      .filter((file) => {
        if (!file.toLowerCase().endsWith('.pdf')) {
          return false;
        }

        const match = file.match(/^(\d+)/);
        if (!match) {
          return false;
        }

        const fileNumber = Number(match[1]);
        return Number.isInteger(fileNumber) && fileNumber >= 1 && fileNumber <= 21;
      })
      .sort((left, right) => left.localeCompare(right))
      .map((file) => path.resolve(DATA_DIR, file));
  }

  private async findUser(): Promise<UserEntity | null> {
    let user = await this.userRepository.findOne({ where: { id: 1 } });

    if (!user) {
      user = await this.userRepository.findOne({ where: {} });
    }

    return user;
  }

  private async runPipeline(
    peticaoId: number,
  ): Promise<{ success: boolean; reason?: string }> {
    return new Promise((resolve, reject) => {
      let completedSuccessfully = false;
      let lastFatalError: string | undefined;

      this.orchestratorStream.run(peticaoId).subscribe({
        next: (event: PipelineEvent) => {
          this.printEvent(event);

          if (event.stage === 'complete' && event.status === 'success') {
            completedSuccessfully = true;
          }

          if (
            event.stage === 'error' &&
            event.status === 'error' &&
            !event.data.recoverable
          ) {
            lastFatalError = event.data.message;
          }
        },
        error: (error) => {
          reject(error);
        },
        complete: () => {
          resolve({
            success: completedSuccessfully,
            reason: lastFatalError,
          });
        },
      });
    });
  }

  private printEvent(event: PipelineEvent): void {
    const duration = event.duration ? `${event.duration}ms` : 'N/A';

    switch (event.stage) {
      case 'resumo':
        console.log(`[RESUMO] ${event.status} | ${duration}`);
        break;

      case 'search':
        console.log(
          `[SEARCH] ${event.status} | ${duration} | found=${event.data.totalFound}`,
        );
        break;

      case 'synthesis':
        console.log(
          `[SYNTHESIS] ${event.status} | ${duration} | precedente=${event.data.precedenteId ?? event.data.precedente_id ?? 'N/A'}`,
        );
        break;

      case 'error':
        console.error(
          `[ERROR] ${duration} | stage=${event.data.failedStage} | recoverable=${event.data.recoverable} | ${event.data.message}`,
        );
        break;

      case 'complete':
        console.log(
          `[COMPLETE] ${event.status} | ${duration} | processed=${event.data.precedentsProcessed} | syntheses=${event.data.synthesisGenerated}`,
        );
        break;
    }
  }

  private sep(char = '─', width = 80): void {
    console.log(char.repeat(width));
  }
}