import { foldAccents } from './fold-accents.js';

const NAME_LABEL = /^(?:(?:se\s+)?(?:confiere|otorga|concede)(?:\s+el\s+presente(?:\s+titulo)?)?\s+a(?:\s+(?:la|el))?|por\s+cuanto|a\s+favor\s+de|a|nombre(?:\s+completo)?|titulado|graduado)\b\s*[:.-]?\s*/i;
const NAME_WORDS = /^[\p{L}][\p{L}\s.'’-]+$/u;
const STOP_NAME = /\b(?:universidad|facultad|rector|decano|grado|titulo|diploma|ingenier\w*|licenciad\w*|licenciatura|carrera|certificado|curso|resolucion|fecha|cochabamba|por haber|ha cumplido|en cumplimiento)\b/;

/** Only explicit recipient contexts; never borrow the applicant's declared name. */
export function readRecipient(lines: string[]): string | null {
  const candidates = new Set<string>();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const label = foldAccents(line).match(NAME_LABEL);
    if (!label) continue;
    const parts: string[] = [];
    const sameLine = line.slice(label[0].length).trim();
    if (sameLine) parts.push(sameLine);
    for (let next = index + 1; next < Math.min(lines.length, index + 3); next += 1) {
      const candidate = lines[next];
      if (STOP_NAME.test(foldAccents(candidate)) || !NAME_WORDS.test(candidate)) break;
      parts.push(candidate);
    }
    const name = parts.join(' ').replace(/\s+/g, ' ').trim();
    const count = name.split(' ').length;
    if (count >= 2 && count <= 10 && NAME_WORDS.test(name) && !STOP_NAME.test(foldAccents(name))) candidates.add(name);
  }
  return candidates.size === 1 ? [...candidates][0] : null;
}

const CAREER_PATTERN = /(?:(?:licenciatura|licenciad[oa])\s+(?:en\s+)?)?(?:ingenier[ií]a|ingenier[oa]|ing\.)\s+(?:(?:de|en)\s+)?(?:sistemas|inform[aá]tica)\b/giu;

/** Controlled aliases: Systems and Informatics are never merged. */
export function canonicalCareer(value: string): string {
  return foldAccents(value).replace(/^(?:licenciatura|licenciad[oa])\s+(?:en\s+)?/, '')
    .replace(/^(?:ingenier[oa]|ing\.)\s+/, 'ingenieria ')
    .replace(/^ingenieria\s+(?:de|en)\s+/, 'ingenieria ')
    .replace(/\s+/g, ' ').trim();
}

export function readCareer(lines: string[]): string | null {
  const candidates = new Map<string, string>();
  for (let index = 0; index < lines.length; index += 1) {
    if (/\b(?:facultad|rector|decano|firma)\b/.test(foldAccents(lines[index]))) continue;
    const next = lines[index + 1] ?? '';
    const window = /\b(?:facultad|rector|decano|firma)\b/.test(foldAccents(next)) ? lines[index] : `${lines[index]} ${next}`;
    for (const match of window.matchAll(CAREER_PATTERN)) {
      const value = match[0].replace(/\s+/g, ' ').trim();
      const key = canonicalCareer(value);
      if (!candidates.has(key)) candidates.set(key, value);
    }
  }
  return candidates.size === 1 ? [...candidates.values()][0] : null;
}
