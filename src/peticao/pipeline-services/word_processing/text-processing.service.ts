import { Injectable } from '@nestjs/common';
import { AggressiveTokenizerPt } from 'natural/lib/natural/tokenizers';
import { PorterStemmerPt } from 'natural/lib/natural/stemmers';
import { removeStopwords, porBr } from 'stopword';

@Injectable()
export class TextProcessingService {
  private readonly tokenizer = new AggressiveTokenizerPt();

  /**
   * Processes a text by applying tokenization, lowercase conversion,
   * stopword removal (pt-BR) and stemming (Porter - pt).
   *
   * @param text Raw text to be processed
   * @returns Processed tokens joined into a space-separated string
   */
  process(text: string): string {
    // 1. Tokenization: splits the text into words, removing punctuation
    const tokens: string[] = this.tokenizer.tokenize(text) ?? [];

    // 2. Lowercase conversion
    const lowercased = tokens.map((token) => token.toLowerCase());

    // 3. Stopword removal (Brazilian Portuguese)
    const withoutStopwords = removeStopwords(lowercased, porBr);

    // 4. Stemming with Porter Stemmer for Portuguese
    const stemmed = withoutStopwords.map((token) =>
      PorterStemmerPt.stem(token),
    );

    return stemmed.join(' ');
  }
}
