export const MAX_MESSAGE_LENGTH = 500;

/**
 * Expresión regular que agrupa secuencias Unicode complejas en un único cluster de grafema:
 * - Secuencias keycap (ej. #️⃣, 1️⃣)
 * - Indicadores regionales de banderas (ej. 🇧🇴 = dos símbolos contiguos de indicador regional)
 * - Emojis base con selectores de variación, modificadores de tono de piel (ej. 👍🏽)
 *   y secuencias ZWJ compuestas (ej. ❣️, ❤️, 👨‍👩‍👧‍👦, 🏳️‍🌈)
 * - Cualquier otro punto de código Unicode / carácter individual
 */
const GRAPHEME_REGEX =
  /(?:(?:\d|[#*])\uFE0F?\u20E3|[\uD83C\uDDE6-\uD83C\uDDFF]{2}|(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:[\uFE0E\uFE0F]|\p{Emoji_Modifier})*(?:\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:[\uFE0E\uFE0F]|\p{Emoji_Modifier})*)*|[\s\S])/gu;

/**
 * Cuenta el número de caracteres percibidos (clusters de grafemas)
 * para garantizar que los emojis, modificadores de tono, banderas
 * y secuencias complejas cuenten exactamente como 1 caracter.
 */
export function countCharacters(text: string): number {
  if (!text) {
    return 0;
  }

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });
    let count = 0;
    const iterator = segmenter.segment(text)[Symbol.iterator]();
    while (!iterator.next().done) {
      count += 1;
    }
    return count;
  }

  // Respaldo robusto con regex Unicode para identificar grafemas y emojis compuestos
  const matches = text.match(GRAPHEME_REGEX);
  return matches ? matches.length : 0;
}

/**
 * Trunca una cadena al máximo de caracteres Unicode especificado,
 * preservando la integridad de grafemas y emojis sin cortar secuencias.
 */
export function truncateToMaxCharacters(text: string, maxLength: number): string {
  if (!text || maxLength <= 0) {
    return '';
  }

  if (countCharacters(text) <= maxLength) {
    return text;
  }

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });
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

  const matches = text.match(GRAPHEME_REGEX);
  if (!matches) return '';
  return matches.slice(0, maxLength).join('');
}

/**
 * Determina si el texto está vacío o contiene únicamente espacios en blanco.
 */
export function isWhitespaceOnly(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Valida si un contenido cumple con los criterios para ser enviado:
 * no estar vacío, no ser solo espacios y no superar el límite de caracteres.
 */
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
