import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// jest.mock() is hoisted by ts-jest before imports, so these mocks are applied
// before TextProcessingService loads its dependencies.

jest.mock('natural/lib/natural/tokenizers', () => ({
  AggressiveTokenizerPt: jest.fn().mockImplementation(() => ({
    tokenize: jest.fn((text: string) =>
      text.trim().length > 0 ? text.split(/\s+/).filter(Boolean) : [],
    ),
  })),
}));

jest.mock('natural/lib/natural/stemmers', () => ({
  PorterStemmerPt: {
    stem: jest.fn((word: string) => `${word}_stem`),
  },
}));

// Mock stopword: treats 'o', 'a', 'de', 'os', 'as', 'e' as stopwords
jest.mock('stopword', () => ({
  removeStopwords: jest.fn((tokens: string[], _lang: unknown) =>
    tokens.filter(
      (t) => !['de', 'o', 'a', 'os', 'as', 'e'].includes(t),
    ),
  ),
  porBr: [],
}));

import { TextProcessingService } from '../../src/peticao/pipeline-services/word_processing/text-processing.service';
import { PorterStemmerPt } from 'natural/lib/natural/stemmers';
import { removeStopwords } from 'stopword';

describe('TextProcessingService', () => {
  let service: TextProcessingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TextProcessingService();
  });

  describe('process', () => {
    it('should return an empty string when input is empty', () => {
      expect(service.process('')).toBe('');
    });

    it('should tokenize, lowercase, remove stopwords and return stemmed tokens joined by space', () => {
      // tokens: ['O', 'gato', 'correu']
      // lowercase: ['o', 'gato', 'correu']
      // remove stopwords (removes 'o'): ['gato', 'correu']
      // stem: ['gato_stem', 'correu_stem']
      const result = service.process('O gato correu');
      expect(result).toBe('gato_stem correu_stem');
    });

    it('should return an empty string when all tokens are stopwords', () => {
      const result = service.process('o a de');
      expect(result).toBe('');
    });

    it('should lowercase tokens before stopword removal', () => {
      // 'O' → lowercase → 'o' → removed as stopword; 'Gato' → 'gato' → kept → 'gato_stem'
      const result = service.process('O Gato');
      expect(result).toBe('gato_stem');
    });

    it('should call PorterStemmerPt.stem for each token that survives stopword removal', () => {
      service.process('gato corre rapido');
      const stemMock = PorterStemmerPt.stem as jest.MockedFunction<
        typeof PorterStemmerPt.stem
      >;
      expect(stemMock).toHaveBeenCalledTimes(3);
      expect(stemMock).toHaveBeenCalledWith('gato');
      expect(stemMock).toHaveBeenCalledWith('corre');
      expect(stemMock).toHaveBeenCalledWith('rapido');
    });

    it('should call removeStopwords with the lowercased tokens and porBr list', () => {
      service.process('Gato Correu');
      const removeStopwordsMock = removeStopwords as jest.MockedFunction<
        typeof removeStopwords
      >;
      expect(removeStopwordsMock).toHaveBeenCalledWith(
        ['gato', 'correu'],
        [],
      );
    });

    it('should return a space-separated string of all stemmed tokens', () => {
      const result = service.process('primeiro segundo terceiro');
      expect(result).toBe('primeiro_stem segundo_stem terceiro_stem');
    });

    it('should handle single word input', () => {
      const result = service.process('peticao');
      expect(result).toBe('peticao_stem');
    });

    it('should not call stem when all tokens are removed as stopwords', () => {
      service.process('o a de');
      const stemMock = PorterStemmerPt.stem as jest.MockedFunction<
        typeof PorterStemmerPt.stem
      >;
      expect(stemMock).not.toHaveBeenCalled();
    });
  });
});
