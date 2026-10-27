import { NLP_STOPWORDS, NLP_TECH_CONTEXT_TERMS } from '../constants/nlp-language.constants.js';
import type { NlpAliasIndex } from '../types/nlp-alias-index.type.js';
import type { NlpAliasPattern } from '../types/nlp-alias-pattern.type.js';
import { hasIntentionCue } from './has-intention-cue.js';
import { isNegatedMention } from './is-negated-mention.js';
import { splitSegments } from './split-segments.js';
import { tokenizeText } from './tokenize-text.js';

function findLongestPattern(
  words: readonly string[],
  content: readonly number[],
  position: number,
  index: NlpAliasIndex,
): NlpAliasPattern | undefined {
  return (index.get(words[content[position]]) ?? []).find(
    (pattern) =>
      position + pattern.tokens.length <= content.length &&
      pattern.tokens.every((token, offset) => words[content[position + offset]] === token),
  );
}

export function detectSkillMentions(text: string, index: NlpAliasIndex): string[] {
  const tokens = tokenizeText(text);
  const mentions: { skillName: string; isAmbiguous: boolean }[] = [];

  for (const words of splitSegments(tokens)) {
    const content = words.flatMap((word, wordIndex) => (NLP_STOPWORDS.has(word) ? [] : [wordIndex]));
    let position = 0;
    while (position < content.length) {
      const pattern = findLongestPattern(words, content, position, index);
      if (!pattern) {
        position += 1;
        continue;
      }
      const start = content[position];
      const previous = position > 0 ? words[content[position - 1]] : '';
      position += pattern.tokens.length;
      if (pattern.blockedPreviousTerms.has(previous)) continue;
      if (isNegatedMention(words, start) || hasIntentionCue(words, start)) continue;
      mentions.push({ skillName: pattern.skillName, isAmbiguous: pattern.isAmbiguous });
    }
  }

  const hasTechContext =
    tokens.some((token) => !token.isBoundary && NLP_TECH_CONTEXT_TERMS.has(token.value)) ||
    mentions.some((mention) => !mention.isAmbiguous);
  const accepted = mentions.filter((mention) => !mention.isAmbiguous || hasTechContext);
  return [...new Set(accepted.map((mention) => mention.skillName))];
}
