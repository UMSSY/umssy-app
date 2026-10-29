import { DIPLOMA_KEYWORDS, MIN_GRADUATION_YEAR, UNIVERSITY_KEYWORDS } from '../constants/document-reading.constants.js';
import type { DocumentReading } from '../types/document-reading.types.js';
import type { DocumentText } from '../types/document-text.types.js';
import type { DeclaredData } from '../types/document-validation.types.js';
import { foldAccents } from './fold-accents.js';

const words = (text: string) => foldAccents(text).replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/).filter(Boolean);

const toLines = (text: string) => text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

// Busca la frase declarada en el texto leído (en una línea o partida en dos) y la devuelve tal como figura
function findPhrase(lines: string[], phrase: string): string | null {
  const target = words(phrase);
  if (target.length === 0) return null;
  for (let index = 0; index < lines.length; index += 1) {
    const window = words(`${lines[index]} ${lines[index + 1] ?? ''}`);
    for (let start = 0; start + target.length <= window.length; start += 1) {
      if (target.every((word, offset) => window[start + offset] === word)) {
        return window.slice(start, start + target.length).join(' ');
      }
    }
  }
  return null;
}

// Línea del documento que más palabras comparte con lo declarado, para mostrar qué se leyó cuando no coincide
function closestLine(lines: string[], phrase: string): string | null {
  const target = new Set(words(phrase));
  let best: { line: string; hits: number } | null = null;
  for (const line of lines) {
    const hits = words(line).filter((word) => target.has(word)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { line, hits };
  }
  return best?.line ?? null;
}

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

export function parseDocumentReading(document: DocumentText, declared: DeclaredData, currentYear: number): DocumentReading {
  const folded = words(document.text).join(' ');
  const lines = toLines(document.text);
  const fullName = `${declared.firstName} ${declared.lastName}`;
  return {
    isDiploma: DIPLOMA_KEYWORDS.some((keyword) => folded.includes(keyword)) && UNIVERSITY_KEYWORDS.some((keyword) => folded.includes(keyword)),
    confidence: Math.min(1, Math.max(0, document.confidence)),
    fullName: findPhrase(lines, fullName) ?? closestLine(lines, fullName),
    career: findPhrase(lines, declared.career) ?? closestLine(lines, declared.career),
    graduationYear: readYear(document.text, currentYear),
  };
}

