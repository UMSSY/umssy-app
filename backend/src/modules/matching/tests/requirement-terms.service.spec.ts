import { beforeEach, describe, expect, it } from 'vitest';
import { SkillDictionaryService } from '../../job-connect/services/skill-dictionary.service.js';
import { NlpService } from '../services/nlp.service.js';
import { RequirementTermsService } from '../services/requirement-terms.service.js';
import { MAX_REQUIREMENT_TEXT_LENGTH } from '../requests/requirement-terms.schema.js';

const SAMPLE_REQUIREMENTS =
  '- Experiencia en Python, C++ y Node.js\n• Titulado de la Universidad Mayor de San Simón\n• Conocimiento de Machine Learning y metodologías Scrum\n';

describe('RequirementTermsService', () => {
  let service: RequirementTermsService;

  beforeEach(() => {
    service = new RequirementTermsService(new NlpService(), new SkillDictionaryService());
  });

  it('devuelve los tokens de los requisitos sin stopwords', () => {
    const result = service.extract('- Experiencia en NestJS\n• Conocimiento de Docker, PostgreSQL');

    expect(result.tokens).toEqual(['experiencia', 'nestjs', 'conocimiento', 'docker', 'postgresql']);
  });

  it('incluye los n-gramas en los terminos y no repite ninguno', () => {
    const result = service.extract('Machine Learning, machine learning');

    expect(result.terms).toEqual(expect.arrayContaining(['machine', 'learning', 'machine_learning']));
    expect(new Set(result.terms).size).toBe(result.terms.length);
  });

  it('detecta las habilidades del diccionario', () => {
    const result = service.extract(SAMPLE_REQUIREMENTS);

    expect(result.skills).toEqual(['Python', 'C++', 'Node.js', 'Scrum', 'Machine Learning']);
  });

  it('detecta las instituciones y las une como terminos compuestos', () => {
    const result = service.extract(SAMPLE_REQUIREMENTS);

    expect(result.institutions).toEqual(['UMSS']);
    expect(result.terms).toEqual(
      expect.arrayContaining(['universidad_mayor_de_san_simon', 'san_simon']),
    );
  });

  it('conserva los tecnicismos con simbolos en los tokens', () => {
    const result = service.extract('C++, C#, .NET, Node.js');

    expect(result.tokens).toEqual(['c++', 'c#', '.net', 'node.js']);
  });

  it.each([[''], ['   '], ['...']])('responde listas vacias con %o', (text) => {
    expect(service.extract(text)).toEqual({ tokens: [], terms: [], skills: [], institutions: [] });
  });

  it('procesa 5000 caracteres en menos de 2 segundos', () => {
    const text = SAMPLE_REQUIREMENTS.repeat(
      Math.ceil(MAX_REQUIREMENT_TEXT_LENGTH / SAMPLE_REQUIREMENTS.length),
    ).slice(0, MAX_REQUIREMENT_TEXT_LENGTH);
    expect(text).toHaveLength(MAX_REQUIREMENT_TEXT_LENGTH);

    const startedAt = performance.now();
    const result = service.extract(text);
    const elapsedMs = performance.now() - startedAt;

    expect(result.tokens.length).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(2000);
  });
});
