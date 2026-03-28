import * as fs from 'fs';
import * as path from 'path';
import { Command, CommandRunner } from 'nest-commander';
import { PipelineOrchestrator } from '../pipeline-services/pipeline_orchestror';

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
  constructor(private readonly orchestrator: PipelineOrchestrator) {
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

    const { rawText, processedText } = await this.orchestrator.run(multerFile);

    console.log('\n[RAW TEXT — first 400 chars]');
    sep();
    console.log(preview(rawText));

    console.log('\n[PROCESSED TEXT — first 400 chars]');
    sep();
    console.log(preview(processedText));

    const rawTokens = rawText.trim().split(/\s+/).length;
    const processedTokens = processedText.trim()
      ? processedText.trim().split(/\s+/).length
      : 0;

    console.log('\n[STATS]');
    sep();
    console.log(`  Raw tokens      : ${rawTokens}`);
    console.log(`  Processed tokens: ${processedTokens}`);
    console.log(
      `  Reduction       : ${(((rawTokens - processedTokens) / rawTokens) * 100).toFixed(1)}%`,
    );
    console.log();
  }
}
