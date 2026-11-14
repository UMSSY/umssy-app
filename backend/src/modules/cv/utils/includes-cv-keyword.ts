import { normalizeTerm } from '../../nlp/utils/normalize-term.js';

export function includesCvKeyword(
  value: string,
  keywords: readonly string[],
): boolean {
  const words = ` ${normalizeTerm(value).replace(/[^\p{L}\p{N}\s]/gu, '')} `;
  return keywords.some((keyword) => words.includes(` ${keyword} `));
}
