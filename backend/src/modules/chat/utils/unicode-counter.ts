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
