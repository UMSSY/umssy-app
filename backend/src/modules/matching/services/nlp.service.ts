import { Injectable } from '@nestjs/common';

@Injectable()
export class NlpService {
  private static readonly STOPWORDS = new Set([
    'a', 'al', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los',
    'para', 'por', 'un', 'una', 'y', 'e', 'o', 'u', 'lo', 'le',
    'les', 'se', 'su', 'sus', 'que', 'sin', 'sobre', 'como', 'muy',
    'unas', 'unos', 'es', 'son', 'ser', 'ha', 'han', 'lidero',
    'proyectos', 'desarrollo', 'usamos', 'metodolia', 'uso',
    'magistral', 'campos',
    'the', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with',
    'an', 'is', 'are',
  ]);

  private static readonly TECH_ALIASES = [
    ['java script', 'javascript'],
    ['react js', 'react'],
    ['vue js', 'vue.js'],
    ['next js', 'next.js'],
    ['node js', 'node.js'],
    ['nodejs', 'node.js'],
    ['reactjs', 'react'],
    ['vuejs', 'vue.js'],
    ['dotnet', '.net'],
    ['cc++', 'c++'],
    ['c #', 'c#'],
    ['js', 'javascript'],
  ] as const;

  private static readonly INSTITUTIONAL_EXCEPTIONS = new Map<string, string>([
    ['umss', 'UMSS'],
    ['san simon', 'San Simón'],
    ['universidad mayor de san simon', 'Universidad Mayor de San Simón'],
    ['cochabamba', 'Cochabamba'],
    ['facultad de ciencias y tecnologia', 'Facultad de Ciencias y Tecnología'],
    ['fcyt', 'FCyT'],
  ]);

  private static readonly MULTIPLE_SPACES_REGEX = /\s+/g;

  normalizeText(text: string): string {
    if (!text) return '';

    return text
      .normalize('NFC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(NlpService.MULTIPLE_SPACES_REGEX, ' ')
      .trim();
  }

  private normalizeTechnicalAliases(text: string): string {
    const aliases = [...NlpService.TECH_ALIASES].sort(
      (a, b) => b[0].length - a[0].length,
    );

    return aliases.reduce((result, [alias, canonical]) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const pattern = new RegExp(
        `(?<![\\p{L}\\p{N}_.])${escaped}(?![\\p{L}\\p{N}_.])`,
        'giu',
      );

      return result.replace(pattern, canonical);
    }, text);
  }

  tokenizeAndFilter(text: string): string[] {
    if (!text) return [];

    const normalized = this.normalizeTechnicalAliases(
      text.normalize('NFC').toLowerCase(),
    );

    const matches = normalized.match(
      /\.net|[\p{L}\p{N}_]+(?:\.[\p{L}\p{N}_]+)*(?:\+\+|#)?/giu,
    );

    if (!matches) return [];

    return matches.filter(
      (token) =>
        token.length > 0 &&
        !NlpService.STOPWORDS.has(token),
    );
  }

  generateNGrams(tokens: string[]): string[] {
    const len = tokens.length;

    if (len < 2) return [];

    const ngrams: string[] = [];

    for (let i = 0; i < len - 1; i++) {
      ngrams.push(`${tokens[i]}_${tokens[i + 1]}`);

      if (i < len - 2) {
        ngrams.push(
          `${tokens[i]}_${tokens[i + 1]}_${tokens[i + 2]}`,
        );
      }
    }

    return [...new Set(ngrams)];
  }

  extractRequirementTerms(text: string): string[] {
    if (!text) return [];

    const tokens = this.tokenizeAndFilter(text);

    if (tokens.length === 0) return [];

    const ngrams = this.generateNGrams(tokens);

    return [...new Set([...tokens, ...ngrams])];
  }

  getInstitutionalExceptions(): Map<string, string> {
    return NlpService.INSTITUTIONAL_EXCEPTIONS;
  }
}