import {
  NLP_CLAUSE_BREAKERS,
  NLP_NEGATION_CUES,
  NLP_NEGATION_EXCEPTIONS,
  NLP_NEGATION_WINDOW,
} from '../constants/nlp-language.constants.js';

const WEAK_NEGATION_CUES: ReadonlySet<string> = new Set(['sin', 'without']);
const KNOWLEDGE_WORDS: ReadonlySet<string> = new Set([
  'experiencia', 'conocimiento', 'conocimientos', 'manejo', 'uso', 'dominio', 'experience', 'knowledge',
]);

export function isNegatedMention(words: readonly string[], mentionStart: number): boolean {
  const firstIndex = Math.max(0, mentionStart - NLP_NEGATION_WINDOW);

  for (let index = mentionStart - 1; index >= firstIndex; index -= 1) {
    const word = words[index];
    if (NLP_CLAUSE_BREAKERS.has(word)) return false;
    if (!NLP_NEGATION_CUES.has(word)) continue;
    if (NLP_NEGATION_EXCEPTIONS.has(words[index + 1] ?? '')) continue;
    if (!WEAK_NEGATION_CUES.has(word)) return true;
    if (index === mentionStart - 1 || KNOWLEDGE_WORDS.has(words[index + 1] ?? '')) return true;
  }
  return false;
}
