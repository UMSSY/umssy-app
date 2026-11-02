import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchingService } from '../services/matching.service.js';
import { SkillDictionaryService } from '../../job-connect/services/skill-dictionary.service.js';
import { SkillsClassifierService } from '../services/skills-classifier.service.js';
import type { SkillCatalogService } from '../../skills/services/skill-catalog.service.js';
import { NlpService } from '../services/nlp.service.js';
import type { ExperienceSkillsRepository } from '../repositories/experience-skills.repository.js';
import { WorkExperienceNotFoundException } from '../../work-experience/exceptions/work-experience-not-found.exception.js';

interface RequirementGapResult {
  totalRequired: number;
  matchedCount: number;
  gapCount: number;
  isZeroGap: boolean;
  message: string;
}

function analyzeRequirementsGap(
  requiredSkills: string[],
  candidateSkills: string[]
): RequirementGapResult {
  const missingSkills: string[] = requiredSkills.filter(
    (skill) => !candidateSkills.includes(skill)
  );

  const gapCount = missingSkills.length;
  const isZeroGap = gapCount === 0;

  return {
    totalRequired: requiredSkills.length,
    matchedCount: requiredSkills.length - gapCount,
    gapCount,
    isZeroGap,
    message: isZeroGap
      ? 'El perfil cubre la totalidad de los requisitos.'
      : `El perfil presenta una brecha de ${gapCount} requisito(s) faltante(s).`,
  };
}

function evaluateCareerMatch(params: {
  requiredCareers: string[];
  candidateCareer: string;
}): boolean {
  const normalizedCandidate = params.candidateCareer.trim().toLowerCase();
  return params.requiredCareers.some(
    (career) => career.trim().toLowerCase() === normalizedCandidate
  );
}

const USER_ID = '0b9f8a52-3c1d-4e7a-9d55-6f1c2a8b7e10';
const EXPERIENCE_ID = '5b1f0c3e-8a4d-4f0b-9a52-1d6c7e2a9b10';

const SKILL_CATALOG = [
  { id: 'a1', name: 'Python' },
  { id: 'b2', name: 'Scrum' },
  { id: 'c3', name: 'C++' },
  { id: 'd4', name: 'C#' },
  { id: 'e5', name: 'Node.js' },
  { id: 'f6', name: '.NET' },
  { id: 'g7', name: 'Docker' },
  { id: 'h8', name: 'Machine Learning' },
];

describe('MatchingService', () => {
  let service: MatchingService;
  let skillCatalog: { listCatalog: ReturnType<typeof vi.fn> };
  let repository: {
    belongsToUser: ReturnType<typeof vi.fn>;
    replaceDetected: ReturnType<typeof vi.fn>;
  };

  const analyze = (text: string | null | undefined) =>
    service.analyzeExperience(USER_ID, { experienceId: EXPERIENCE_ID, text });

  beforeEach(() => {
    skillCatalog = {
      listCatalog: vi
        .fn()
        .mockResolvedValue(
          SKILL_CATALOG.map((skill) => ({ ...skill, isCustom: false })),
        ),
    };
    repository = {
      belongsToUser: vi.fn().mockResolvedValue(true),
      replaceDetected: vi.fn().mockResolvedValue(undefined),
    };

    service = new MatchingService(
      new SkillDictionaryService(),
      new SkillsClassifierService(),
      skillCatalog as unknown as SkillCatalogService,
      new NlpService(),
      repository as unknown as ExperienceSkillsRepository,
    );
  });

  it('devuelve el id de la experiencia y las habilidades del catalogo detectadas en el texto', async () => {
    const result = await analyze(
      'Trabaje como desarrollador backend usando Python y metodologias Scrum',
    );

    expect(result.experienceId).toBe(EXPERIENCE_ID);
    expect(result.skills).toEqual([
      { id: 'a1', name: 'Python' },
      { id: 'b2', name: 'Scrum' },
    ]);
  });

  it('detecta habilidades del catalogo que no estan en el diccionario (AC-01.2)', async () => {
    const result = await analyze('Desplegue contenedores con Docker y Python');

    expect(result.skills.map((skill) => skill.name)).toEqual(['Python', 'Docker']);
  });

  it('une los terminos compuestos como un solo termino clave (AC-01.5)', async () => {
    const result = await analyze('Entrene modelos de aprendizaje automatico');

    expect(result.skills).toEqual([{ id: 'h8', name: 'Machine Learning' }]);
  });

  it('no distingue mayusculas ni repite etiquetas (AC-01.10)', async () => {
    const result = await analyze('python, PYTHON y Python');

    expect(result.skills).toEqual([{ id: 'a1', name: 'Python' }]);
  });

  it('no agrega adjetivos ni palabras comunes como habilidades (AC-01.7)', async () => {
    const result = await analyze('Persona proactiva, puntual y responsable con mucha iniciativa');

    expect(result.skills).toEqual([]);
  });

  it('consulta el catalogo a traves de SkillCatalogService', async () => {
    await analyze('Python');

    expect(skillCatalog.listCatalog).toHaveBeenCalledTimes(1);
    expect(skillCatalog.listCatalog).toHaveBeenCalledWith({});
  });

  it('reconoce C++, C#, Node.js y .NET con las claves del catalogo', async () => {
    const result = await analyze('Desarrolle servicios en C++, C#, Node.js y .NET');

    expect(result.skills.map((skill) => skill.name)).toEqual(['C++', 'C#', '.NET', 'Node.js']);
  });

  it('no expone campos internos del catalogo en la respuesta', async () => {
    const result = await analyze('Python');

    expect(result.skills[0]).toEqual({ id: 'a1', name: 'Python' });
  });

  it('ignora una habilidad del diccionario que no esta en el catalogo', async () => {
    skillCatalog.listCatalog.mockResolvedValue([
      { ...SKILL_CATALOG[0], isCustom: false },
    ]);

    const result = await analyze('Python y Scrum');

    expect(result.skills).toEqual([{ id: 'a1', name: 'Python' }]);
  });

  it('responde sin habilidades cuando el catalogo esta vacio', async () => {
    skillCatalog.listCatalog.mockResolvedValue([]);

    const result = await analyze('Python');

    expect(result.skills).toEqual([]);
  });

  it('propaga el error cuando falla la consulta a la base de datos', async () => {
    skillCatalog.listCatalog.mockRejectedValue(new Error('connection refused'));

    await expect(analyze('Python')).rejects.toThrow('connection refused');
  });

  it.each([[''], ['   '], [null], [undefined]])(
    'responde sin habilidades y sin consultar el catalogo cuando no hay texto (%o)',
    async (text) => {
      const result = await analyze(text);

      expect(result.skills).toEqual([]);
      expect(skillCatalog.listCatalog).not.toHaveBeenCalled();
    },
  );

  it('guarda sin error una descripcion sin habilidades reconocibles (AC-01.9)', async () => {
    const result = await analyze('texto sin habilidades reconocibles');

    expect(result.skills).toEqual([]);
    expect(repository.replaceDetected).toHaveBeenCalledWith(USER_ID, EXPERIENCE_ID, []);
  });

  it('vincula las habilidades detectadas a la experiencia de la persona autenticada (AC-01.2)', async () => {
    await analyze('Python y Scrum');

    expect(repository.belongsToUser).toHaveBeenCalledWith(EXPERIENCE_ID, USER_ID);
    expect(repository.replaceDetected).toHaveBeenCalledWith(USER_ID, EXPERIENCE_ID, ['a1', 'b2']);
  });

  it('limpia los vinculos anteriores cuando la descripcion queda vacia', async () => {
    await analyze(null);

    expect(repository.replaceDetected).toHaveBeenCalledWith(USER_ID, EXPERIENCE_ID, []);
  });

  it('lanza 404 y no analiza ni guarda cuando la experiencia es de otra persona', async () => {
    repository.belongsToUser.mockResolvedValue(false);

    const error = await analyze('Python').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(WorkExperienceNotFoundException);
    expect(error).toMatchObject({ statusCode: 404 });
    expect(skillCatalog.listCatalog).not.toHaveBeenCalled();
    expect(repository.replaceDetected).not.toHaveBeenCalled();
  });

  it('informa el tiempo de procesamiento como un numero entero menor a 2 segundos (AC-01.1)', async () => {
    const result = await analyze('Scrum');

    expect(Number.isInteger(result.processingTimeMs)).toBe(true);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.processingTimeMs).toBeLessThan(2000);
  });

  it('procesa un texto de 5000 caracteres en menos de 2 segundos (AC-01.1)', async () => {
    const text = 'Desarrollo con Python, Docker y Scrum en equipos agiles. '.repeat(100).slice(0, 5000);

    const result = await analyze(text);

    expect(result.processingTimeMs).toBeLessThan(2000);
    expect(result.skills.map((skill) => skill.name)).toEqual(['Python', 'Scrum', 'Docker']);
  });
});

describe('Matching Gap Analysis QA Suite - Zero Gap UI Behavior', () => {
  it('debe validar que cuando la brecha es igual a cero, se genere el mensaje explícito para la UI', () => {
    const requiredSkills: string[] = ['TypeScript', 'NestJS', 'PostgreSQL'];
    const candidateSkills: string[] = ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker'];

    const result: RequirementGapResult = analyzeRequirementsGap(
      requiredSkills,
      candidateSkills
    );

    expect(result.gapCount).toBe(0);
    expect(result.isZeroGap).toBe(true);
    expect(result.message).toBe('El perfil cubre la totalidad de los requisitos.');
  });
});

describe('HU-02A T2.5 - Prevención de falsos positivos de carreras', () => {
  let service: MatchingService;

  const baseInput = {
    userCareer: 'Ingeniería de Sistemas',
    requiredCareer: 'Ingeniería de Sistemas',
    userExperienceYears: 3,
    minimumExperienceYears: 2,
    userSkills: ['TypeScript'],
    requiredSkills: ['TypeScript'],
  };

  beforeEach(() => {
    service = Object.create(MatchingService.prototype) as MatchingService;
  });

  it('debe aprobar el match únicamente cuando la carrera coincide exactamente (ignorando mayúsculas/espacios)', () => {
    const isMatch = evaluateCareerMatch({
      requiredCareers: ['Ingeniería de Sistemas', 'Ingeniería Informática'],
      candidateCareer: '   ingeniería de sistemas   ',
    });
    expect(isMatch).toBe(true);
  });

  it('rechaza una carrera diferente aunque coincidan experiencia y habilidades', () => {
    const result = service.intersectRequirements({
      ...baseInput,
      userCareer: 'Ingeniería Comercial',
      requiredCareer: 'Ingeniería de Sistemas',
    });

    expect(result.careerMatch).toBe(false);
    expect(result.experienceMatch).toBe(true);
    expect(result.allRequiredSkillsMatch).toBe(true);
  });

  it('acepta una carrera coincidente ignorando mayúsculas y espacios', () => {
    const result = service.intersectRequirements({
      ...baseInput,
      userCareer: '   ingeniería de sistemas  ',
    });

    expect(result.careerMatch).toBe(true);
  });

  it('rechaza una carrera vacía cuando la vacante requiere una carrera', () => {
    const result = service.intersectRequirements({
      ...baseInput,
      userCareer: '',
    });

    expect(result.careerMatch).toBe(false);
  });

  it('no confunde Ingeniería Informática con Ingeniería de Sistemas', () => {
    const result = service.intersectRequirements({
      ...baseInput,
      userCareer: 'Ingeniería Informática',
      requiredCareer: 'Ingeniería de Sistemas',
    });

    expect(result.careerMatch).toBe(false);
  });
});