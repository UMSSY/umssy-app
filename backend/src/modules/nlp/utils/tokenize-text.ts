import type { NlpToken } from '../types/nlp-token.type.js';
import { normalizeTerm } from './normalize-term.js';

const TOKEN_PATTERN = /\.?[\p{L}\p{N}][\p{L}\p{N}+#.\-_]*|[.,;:!?()[\]{}"«»¿¡|•·\n]/gu;
const BOUNDARY_PATTERN = /^[.,;:!?()[\]{}"«»¿¡|•·\n]$/u;
const TRAILING_SEPARATORS = /[.\-_]+$/u;

export function tokenizeText(text: string): NlpToken[] {
  const normalized = (text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const tokens: NlpToken[] = [];

  for (const [match] of normalized.matchAll(TOKEN_PATTERN)) {
    if (BOUNDARY_PATTERN.test(match)) {
      tokens.push({ value: match, isBoundary: true });
      continue;
    }
    const trailing = match.match(TRAILING_SEPARATORS)?.[0] ?? '';
    const word = normalizeTerm(match.slice(0, match.length - trailing.length));
    if (word) tokens.push({ value: word, isBoundary: false });
    if (trailing.includes('.')) tokens.push({ value: '.', isBoundary: true });
  }

  return tokens;
}
