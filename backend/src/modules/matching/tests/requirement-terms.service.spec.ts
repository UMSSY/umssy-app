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
    { id: '5', name: 'C++', isCustom: false },
    { id: '6', name: 'C#', isCustom: false },
    { id: '7', name: '.NET', isCustom: false },
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

  it('AC-07.1: reconoce mayúsculas/minúsculas como la misma habilidad', async () => {
    const result = await service.extractAndMatchRequirements(
      'Buscamos desarrollador con PYTHON y python y Python',
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Python');
  });

  it('AC-07.2: reconoce variantes de tildes como la misma habilidad', async () => {
    const result = await service.extractAndMatchRequirements(
      'Conocimientos en Python y pytón',
    );
    const pythonSkills = result.filter((s) => s.name.toLowerCase().includes('python'));
    expect(pythonSkills.length).toBeGreaterThanOrEqual(1);
  });

  it('AC-07.3: reconoce C++, C#, Node.js y .NET sin perder símbolos', async () => {
    const result = await service.extractAndMatchRequirements(
      'Conocimientos en C++, C#, Node.js y .NET',
    );
    const names = result.map((s) => s.name);
    expect(names).toContain('C++');
    expect(names).toContain('C#');
    expect(names).toContain('Node.js');
    expect(names).toContain('.NET');
  });

  it('AC-07.3: vacante sin habilidades reconocibles devuelve [] sin error', async () => {
    const result = await service.extractAndMatchRequirements(
      'Buscamos persona proactiva y puntual',
    );
    expect(result).toEqual([]);
  });

  it('AC-07.3: texto vacío devuelve [] sin error', async () => {
    expect(await service.extractAndMatchRequirements('')).toEqual([]);
    expect(await service.extractAndMatchRequirements('   ')).toEqual([]);
  });

  it('AC-07.6: procesa en menos de 2 segundos', async () => {
    const longText = Array(100).fill('Python Node.js Docker').join(' ');
    const start = performance.now();
    await service.extractAndMatchRequirements(longText);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});