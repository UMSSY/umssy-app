export const MAX_MESSAGE_LENGTH = 500;

export function countCharacters(text: string): number {
  if (!text) {
    return 0;
  }

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).length;
  }

  return Array.from(text).length;
}

export function truncateToMaxCharacters(text: string, maxLength: number): string {
  if (!text || maxLength <= 0) {
    return '';
  }

  if (countCharacters(text) <= maxLength) {
    return text;
  }

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });
    let count = 0;
    let result = '';

    for (const segment of segmenter.segment(text)) {
      if (count >= maxLength) {
        break;
      }
      result += segment.segment;
      count += 1;
    }

    return result;
  }

  const codePoints = Array.from(text);
  return codePoints.slice(0, maxLength).join('');
}

export function isWhitespaceOnly(text: string): boolean {
  return text.trim().length === 0;
}
export function isContentValidForSend(
  text: string,
  maxLength: number = MAX_MESSAGE_LENGTH
): boolean {
  if (isWhitespaceOnly(text)) {
    return false;
  }

  const count = countCharacters(text);
  return count > 0 && count <= maxLength;
}

