import { removeStopwords } from './remove-stopwords.js';
import { tokenizeText } from './tokenize-text.js';

export function toContentWords(text: string): string[] {
  return removeStopwords(tokenizeText(text))
    .filter((token) => !token.isBoundary)
    .map((token) => token.value);
}
