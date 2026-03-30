import * as fs from 'fs';
import * as path from 'path';
import { Command, CommandRunner } from 'nest-commander';
import { PipelineOrchestrator } from '../pipeline-services/pipeline_orchestror';
import { PeticaoService } from '../service/peticao.service';

const DATA_DIR = path.resolve(process.cwd(), 'dev-tools', 'data');

const MIMETYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

@Command({
  name: 'run:pipeline',
  arguments: '<filename>',
  description: 'Run the full NLP pipeline on a file from dev-tools/data/',
})
export class RunPipelineCommand extends CommandRunner {
  constructor(
    private readonly orchestrator: PipelineOrchestrator,
    private readonly peticaoService: PeticaoService,
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

    const buffer = fs.readFileSync(filePath);
    const originalname = path.basename(filePath);
    const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
    const mimetype = MIMETYPE_MAP[ext] ?? 'application/octet-stream';

    const multerFile: Express.Multer.File = {
      buffer,
      originalname,
      mimetype,
      fieldname: 'file',
      encoding: '7bit',
      size: buffer.length,
      stream: null as any,
      destination: '',
      filename: originalname,
      path: filePath,
    };

    const sep = (char = '─', w = 80) => console.log(char.repeat(w));
    const preview = (text: string, max = 400) => {
      const clean = text.replace(/\s+/g, ' ').trim();
      return clean.length > max ? clean.slice(0, max) + ' …' : clean;
    };

    sep('═');
    console.log(`FILE: ${originalname}`);
    sep('═');

    console.log('\n[INFO] Registering petition in database...');
    await this.peticaoService.create(filePath, 1);

    const allPeticoes = await this.peticaoService.findAll();
    const peticao = allPeticoes.find(p => p.caminhoArquivo === filePath) || allPeticoes[allPeticoes.length - 1];

    console.log(`[INFO] Running full pipeline for Petição ID: ${peticao.id}...`);

    const result = await this.orchestrator.run(peticao.id);

    console.log('\n[SUMMARY]');
    sep();
    console.log(result.resumo ? result.resumo : 'No summary generated (Synthesis skipped for this sprint)');

    console.log('\n[SUGGESTED PRECEDENTS]');
    sep();
    if (result.precedentes.length === 0) {
      console.log('No precedents suggested (Try checking if your database has seeded precedents with vectors)');
    } else {
      result.precedentes.forEach(p => {
        console.log(`- ${p.numero_registro} (Similarity: ${((1 - (p.score || 0)) * 100).toFixed(2)}%)`);
        if (p.tese) console.log(`  Tese: ${p.tese.substring(0, 100)}...`);
      });
    }

    console.log('\n[ANALYSIS COMPLETED SUCCESSFULLY]');
    console.log();
  }
}
