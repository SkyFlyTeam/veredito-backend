/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// npx ts-node -r tsconfig-paths/register scripts/test-embeddings.ts "Seu texto aqui"

import * as fs from 'fs';
import * as path from 'path';
import { EmbeddingsService } from '../src/embeddings/embeddings.service';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

async function main() {
  loadEnv();

  const text = process.argv[2] || 'Isso é um teste de geração de embeddings.';

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      'Error: OPENAI_API_KEY not found in environment or .env file.',
    );
    process.exit(1);
  }

  const service = new EmbeddingsService();

  console.log(`\n--- Testing Embeddings Service ---`);
  console.log(`Input: "${text}"`);
  console.log(`Model: text-embedding-3-large\n`);

  try {
    const start = Date.now();
    const embedding = await service.generateEmbedding(text);
    const duration = Date.now() - start;

    console.log(`SUCCESS! Generation took ${duration}ms`);
    console.log(`Embedding Length: ${embedding.length}`);
    console.log(`First 5 values: [${embedding.slice(0, 5).join(', ')}...]`);
    console.log(`Last 5 values:  [${embedding.slice(-5).join(', ')}...]`);
    console.log(`---------------------------------\n`);
  } catch (err: any) {
    console.error(`\nFAILED!`);
    console.error(`Error: ${err.message}`);
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Data:`, err.response.data);
    }
    process.exit(1);
  }
}

main();
