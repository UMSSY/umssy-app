import type { NlpAliasIndex } from '../types/nlp-alias-index.type.js';
import type { NlpAliasPattern } from '../types/nlp-alias-pattern.type.js';
import type { NlpDictionaryEntry } from '../types/nlp-dictionary-entry.type.js';
import { normalizeTerm } from './normalize-term.js';
import { toContentWords } from './to-content-words.js';

export function buildAliasIndex(dictionary: readonly NlpDictionaryEntry[]): NlpAliasIndex {
  const index = new Map<string, NlpAliasPattern[]>();

  for (const entry of dictionary) {
    const blockedPreviousTerms = new Set((entry.blockedPreviousTerms ?? []).map(normalizeTerm));
    const addAlias = (alias: string, isAmbiguous: boolean) => {
      const tokens = toContentWords(alias);
      if (tokens.length === 0) return;
      const patterns = index.get(tokens[0]) ?? [];
      patterns.push({ skillName: entry.name, tokens, isAmbiguous, blockedPreviousTerms });
      index.set(tokens[0], patterns);
    };
    entry.aliases.forEach((alias) => addAlias(alias, false));
    (entry.ambiguousAliases ?? []).forEach((alias) => addAlias(alias, true));
  }

  for (const patterns of index.values()) {
    patterns.sort((first, second) => second.tokens.length - first.tokens.length);
  }
  return index;
}
