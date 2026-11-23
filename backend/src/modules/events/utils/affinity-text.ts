import {
  AFFINITY_STOPWORDS,
  MIN_KEYWORD_LENGTH,
} from '../constants/event-affinity.constants.js';

export function normalizeAffinityText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim();
}

export function containsPhrase(normalizedText: string, phrase: string): boolean {
  const normalizedPhrase = normalizeAffinityText(phrase);
  return (
    normalizedPhrase.length > 0 &&
    ` ${normalizedText} `.includes(` ${normalizedPhrase} `)
  );
}

export function extractKeywords(text: string): string[] {
  const words = normalizeAffinityText(text).split(' ');
  return [
    ...new Set(
      words.filter(
        (word) =>
          word.length >= MIN_KEYWORD_LENGTH && !AFFINITY_STOPWORDS.has(word),
      ),
    ),
  ];
}
