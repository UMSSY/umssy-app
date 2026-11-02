import { DIPLOMA_KEYWORDS, MIN_GRADUATION_YEAR, UNIVERSITY_KEYWORDS } from '../constants/document-reading.constants.js';
import type { DocumentReading } from '../types/document-reading.types.js';
import type { DocumentText } from '../types/document-text.types.js';
import type { DeclaredData } from '../types/document-validation.types.js';
import { readCareer, readRecipient } from './read-document-fields.js';
import { foldAccents } from './fold-accents.js';

const words = (text: string) => foldAccents(text).replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/).filter(Boolean);

const toLines = (text: string) => text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

function readYear(text: string, currentYear: number): number | null {
  const lines = toLines(text)
    .map((line) => foldAccents(line))
    .filter((line) => !/\b(?:resolucion|decreto|ley)\b/.test(line));
  const valid = (year: number) => year >= MIN_GRADUATION_YEAR && year <= currentYear;
  const dates = new Set<number>();

  for (const line of lines) {
    const patterns = [
      /\b\d{1,2}\s+de\s+[a-zñ]+\s+(?:de|del)\s+((?:19|20)\d{2})\b/g,
      /\b\d{1,2}[/-]\d{1,2}[/-]((?:19|20)\d{2})\b/g,
      /\b((?:19|20)\d{2})-\d{2}-\d{2}\b/g,
    ];
    for (const pattern of patterns) {
      for (const match of line.matchAll(pattern)) {
        const year = Number(match[1]);
        if (valid(year)) dates.add(year);
      }
    }
  }

  if (dates.size > 0) return dates.size === 1 ? (dates.values().next().value ?? null) : null;
  const years = new Set(
    (lines.join('\n').match(/\b(?:19|20)\d{2}\b/g) ?? [])
      .map(Number)
      .filter(valid),
  );
  return years.size === 1 ? (years.values().next().value ?? null) : null;
}

export function parseDocumentReading(document: DocumentText, _declared: DeclaredData, currentYear: number): DocumentReading {
  const folded = words(document.text).join(' ');
  const lines = toLines(document.text);
  const isDiploma = DIPLOMA_KEYWORDS.some((keyword) => folded.includes(keyword)) && UNIVERSITY_KEYWORDS.some((keyword) => folded.includes(keyword));
  const unsupported = /\b(?:curso de|curso|diplomado|participacion|asistencia|factura)\b/.test(folded);
  const fullName = readRecipient(lines);
  const career = readCareer(lines);
  const graduationYear = readYear(document.text, currentYear);
  const confidence = Number.isFinite(document.confidence) ? Math.min(1, Math.max(0, document.confidence)) : 0;
  const fieldWords = new Set(words(`${fullName ?? ''} ${career ?? ''} ${graduationYear ?? ''}`));
  const relevant = (document.regions ?? []).filter((region) => words(region.text).some((word) => fieldWords.has(word)));
  const fieldConfidence = relevant.length
    ? Math.min(confidence, ...relevant.map((region) => Number.isFinite(region.confidence) ? Math.min(1, Math.max(0, region.confidence)) : 0))
    : confidence;
  return {
    isDiploma,
    documentKind: isDiploma ? 'supported' : unsupported ? 'unsupported' : 'unknown',
    confidence: fieldConfidence,
    fullName,
    career,
    graduationYear,
  };
}
