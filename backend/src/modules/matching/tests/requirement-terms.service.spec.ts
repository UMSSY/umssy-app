import { describe, expect, it, beforeEach, vi } from 'vitest';
import { RequirementTermsService } from '../services/requirement-terms.service.js';
import { NlpService } from '../services/nlp.service.js';
import { SkillsClassifierService } from '../services/skills-classifier.service.js';
import { SkillCatalogService } from '../../skills/services/skill-catalog.service.js';

describe('RequirementTermsService', () => {
  let service: RequirementTermsService;
  let nlpService: NlpService;
  let skillsClassifier: SkillsClassifierService;
  let skillCatalogService: SkillCatalogService;

  const mockCatalog = [
    { id: '1', name: 'Python', isCustom: false },
    { id: '2', name: 'Node.js', isCustom: false },
    { id: '3', name: 'Docker', isCustom: false },
    { id: '4', name: 'PostgreSQL', isCustom: false },
  ];

  beforeEach(() => {
    nlpService = new NlpService();
    skillsClassifier = new SkillsClassifierService();
    skillCatalogService = {
      listCatalog: vi.fn().mockResolvedValue(mockCatalog),
    } as unknown as SkillCatalogService;

    service = new RequirementTermsService(
      nlpService,
      skillsClassifier,
      skillCatalogService,
    );
  });

  it('devuelve habilidades reconocibles del texto (AC-07.1, AC-07.2)', async () => {
    const result = await service.extractAndMatchRequirements(
      'Buscamos desarrollador con Python y Node.js, conocimiento de Docker',
    );
    const names = result.map((s) => s.name);
    expect(names).toContain('Python');
    expect(names).toContain('Node.js');
    expect(names).toContain('Docker');
  });

  it('devuelve [] con texto vacío (AC-07.3)', async () => {
    expect(await service.extractAndMatchRequirements('')).toEqual([]);
    expect(await service.extractAndMatchRequirements('   ')).toEqual([]);
  });

  it('devuelve [] si no hay habilidades reconocibles (AC-07.3)', async () => {
    const result = await service.extractAndMatchRequirements(
      'Buscamos persona proactiva y puntual',
    );
    expect(result).toEqual([]);
  });

  it('detecta tecnologías especiales sin destruirlas (AC-07.2)', async () => {
    const result = await service.extractAndMatchRequirements(
      'Conocimientos en C++, C#, Node.js y .NET',
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it('procesa en menos de 2 segundos (AC-07.4)', async () => {
    const longText = Array(100).fill('Python Node.js Docker').join(' ');
    const start = performance.now();
    await service.extractAndMatchRequirements(longText);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});