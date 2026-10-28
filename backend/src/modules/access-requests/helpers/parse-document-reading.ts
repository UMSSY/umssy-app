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

function readYear(text: string, declaredYear: number, currentYear: number): number | null {
  const years = (text.match(/\b(?:19|20)\d{2}\b/g) ?? []).map(Number).filter((year) => year >= MIN_GRADUATION_YEAR && year <= currentYear);
  if (years.length === 0) return null;
  return years.includes(declaredYear) ? declaredYear : Math.max(...years);
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
    graduationYear: readYear(document.text, declared.graduationYear, currentYear),
  };
}

