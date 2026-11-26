import {
  NLP_CLAUSE_BREAKERS,
  NLP_INTENTION_CUES,
} from '../constants/nlp-language.constants.js';

export function hasIntentionCue(
  words: readonly string[],
  mentionStart: number,
): boolean {
  const firstIndex = Math.max(0, mentionStart - 3);

  for (let index = mentionStart - 1; index >= firstIndex; index -= 1) {
    if (NLP_CLAUSE_BREAKERS.has(words[index])) return false;
    if (NLP_INTENTION_CUES.has(words[index])) return true;
  }
  return false;
}
