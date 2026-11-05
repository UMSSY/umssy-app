import { Injectable } from '@nestjs/common';

@Injectable()
export class NlpService {
  private static readonly STOPWORDS = new Set([
    'a', 'al', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'para', 'por', 'un', 'una', 'y',
    'e', 'o', 'u', 'lo', 'le', 'les', 'se', 'su', 'sus', 'que', 'sin', 'sobre', 'como', 'muy',
    'unas', 'unos', 'es', 'son', 'ser', 'ha', 'han', 'lidero', 'proyectos', 'desarrollo', 'amplia',
    'experiencia', 'usamos', 'metodolia', 'uso', 'magistral', 'campos',
    'the', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with', 'an', 'is', 'are',
  ]);

  private static readonly INSTITUTIONAL_EXCEPTIONS = new Map<string, string>([
    ['umss', 'UMSS'],
    ['san simon', 'San Simón'],
    ['universidad mayor de san simon', 'Universidad Mayor de San Simón'],
    ['cochabamba', 'Cochabamba'],
    ['facultad de ciencias y tecnologia', 'Facultad de Ciencias y Tecnología'],
    ['fcyt', 'FCyT'],
  ]);

  private static readonly TECH_ALIASES = new Map<string, string>([
    ['java script', 'javascript'],
    ['js', 'javascript'],
    ['c++', 'cpp'],
    ['cc++', 'c++'],
    ['c #', 'c#'],
    ['node js', 'nodejs'],
    ['react js', 'react'],
    ['vue js', 'vue'],
  ]);

  private static readonly CLEAN_PUNCTUATION_REGEX = /[^\w\sñáéíóúü+#-]/g;
  private static readonly MULTIPLE_SPACES_REGEX = /\s+/g;
  private static readonly TOKEN_SEPARATOR_REGEX = /[\s,;:!?()[\]{}"'¿¡/|\\•·*]+/u;

  normalizeText(text: string): string {
    if (!text) return '';

    let cleaned = text
      .toLowerCase()
      .normalize('NFC')
      .replace(NlpService.CLEAN_PUNCTUATION_REGEX, '')
      .replace(NlpService.MULTIPLE_SPACES_REGEX, ' ')
      .trim();

    for (const [alias, canonical] of NlpService.TECH_ALIASES.entries()) {
      if (cleaned.includes(alias)) {
        cleaned = cleaned.replace(new RegExp(alias, 'g'), canonical);
      }
    }

    return cleaned;
  }

  tokenizeAndFilter(text: string): string[] {
    if (!text) return [];

    const normalized = this.normalizeText(text);
    const parts = normalized.split(NlpService.TOKEN_SEPARATOR_REGEX);
    const result: string[] = [];

    for (const part of parts) {
      const token = part.trim();
      if (token.length > 0 && !NlpService.STOPWORDS.has(token)) {
        result.push(token);
      }
    }
    return result;
  }

  generateNGrams(tokens: string[]): string[] {
    const len = tokens.length;
    if (len < 2) return [];

    const ngrams: string[] = [];

    for (let i = 0; i < len - 1; i++) {

      ngrams.push(`${tokens[i]}_${tokens[i + 1]}`);
      ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);


      if (i < len - 2) {
        ngrams.push(`${tokens[i]}_${tokens[i + 1]}_${tokens[i + 2]}`);
        ngrams.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
      }
    }

    return ngrams;
  }

  extractRequirementTerms(text: string): string[] {
    if (!text) return [];
    const tokens = this.tokenizeAndFilter(text);
    const ngrams = this.generateNGrams(tokens);

    return [...new Set([...tokens, ...ngrams])];
  }

  getInstitutionalExceptions(): Map<string, string> {
    return NlpService.INSTITUTIONAL_EXCEPTIONS;
  }
}