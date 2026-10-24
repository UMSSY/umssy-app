import type { NlpToken } from '../types/nlp-token.type.js';

// A segment is the run of words between punctuation marks; a mention never spans two segments.
export function splitSegments(tokens: readonly NlpToken[]): string[][] {
  const segments: string[][] = [];
  let current: string[] = [];

  for (const token of tokens) {
    if (token.isBoundary) {
      if (current.length > 0) segments.push(current);
      current = [];
    } else {
      current.push(token.value);
    }
  }
  if (current.length > 0) segments.push(current);

  return segments;
}
