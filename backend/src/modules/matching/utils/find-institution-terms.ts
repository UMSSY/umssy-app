import { institutionalDictionary } from '../../job-connect/constants/skill-dictionary.js';
import { normalizeTerm } from '../../job-connect/services/skill-dictionary.service.js';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MULTI_WORD_ALIASES = institutionalDictionary
  .flatMap(({ aliases }) => aliases)
  .filter((alias) => alias.includes(' '))
  .map((alias) => ({
    term: alias.replace(/ /g, '_'),
    pattern: new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegex(alias)}(?![\\p{L}\\p{N}_])`, 'u'),
  }));

export function findInstitutionTerms(text: string): string[] {
  const normalized = normalizeTerm(text);
  return MULTI_WORD_ALIASES.filter(({ pattern }) => pattern.test(normalized)).map(
    ({ term }) => term,
  );
}
