import { NLP_STOPWORDS } from '../constants/nlp-language.constants.js';
import type { NlpToken } from '../types/nlp-token.type.js';

export function removeStopwords(tokens: readonly NlpToken[]): NlpToken[] {
  return tokens.filter((token) => token.isBoundary || !NLP_STOPWORDS.has(token.value));
}
