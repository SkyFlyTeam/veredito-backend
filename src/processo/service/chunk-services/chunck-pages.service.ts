import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ProcessChunk } from '../../types/chunk.type';

export async function chunkProcessText(
  fullText: string,
): Promise<ProcessChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 3500,
    chunkOverlap: 500,
    separators: ['\n\n', '\n', '. ', '; ', ', ', ' ', ''],
  });

  const chunks = await splitter.splitText(fullText);

  return chunks.map((text, index) => ({
    index,
    text,
  }));
}
