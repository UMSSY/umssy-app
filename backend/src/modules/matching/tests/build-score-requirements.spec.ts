import { describe, expect, it } from 'vitest';
import type {
  CandidateProfile,
  VacancyRequirements,
} from '../types/gap-analysis.types.js';
import {
  buildScoreRequirements,
  hasPendingRequirements,
  toCategorizedRequirements,
} from '../utils/build-score-requirements.js';
import { calculateWeightedScore } from '../utils/calculate-weighted-score.js';

const candidate = (
  overrides: Partial<CandidateProfile> = {},
): CandidateProfile => ({
  skills: [],
  ...overrides,
});

describe('buildScoreRequirements: habilidades (AC-04.2, AC-04.3, AC-04.8)', () => {
  it('marca Cumple lo que está en el perfil y Pendiente lo que falta', () => {
    const { skills } = buildScoreRequirements(
      { skills: ['Docker', 'Kubernetes', 'Terraform'] },
      candidate({ skills: ['Docker', 'Kubernetes', 'Git'] }),
    );

    expect(skills).toEqual([
      { name: 'Docker', status: 'Cumple' },
      { name: 'Kubernetes', status: 'Cumple' },
      { name: 'Terraform', status: 'Pendiente' },
    ]);
  });

  it('no distingue mayúsculas, minúsculas ni tildes ("python" cumple "Python")', () => {
    const { skills } = buildScoreRequirements(
      { skills: ['Python', 'Análisis de datos', 'GIT'] },
      candidate({ skills: ['python', 'analisis de datos', 'git'] }),
    );

    expect(skills.map(({ status }) => status)).toEqual([
      'Cumple',
      'Cumple',
      'Cumple',
    ]);
  });

  it.each([['C++'], ['C#'], ['Node.js'], ['.NET']])(
    'compara %s tal como viene en el catálogo',
    (name) => {
      const met = buildScoreRequirements(
        { skills: [name] },
        candidate({ skills: [name.toLowerCase()] }),
      );
      const missing = buildScoreRequirements(
        { skills: [name] },
        candidate({ skills: ['C'] }),
      );

      expect(met.skills).toEqual([{ name, status: 'Cumple' }]);
      expect(missing.skills).toEqual([{ name, status: 'Pendiente' }]);
    },
  );

  it('descarta vacíos y repetidos de la vacante y conserva la primera grafía', () => {
    const { skills } = buildScoreRequirements(
      { skills: ['  Docker ', 'docker', '', '   ', 'DOCKER', 'AWS'] },
      candidate(),
    );

    expect(skills).toEqual([
      { name: 'Docker', status: 'Pendiente' },
      { name: 'AWS', status: 'Pendiente' },
    ]);
  });

  it('un perfil sin habilidades deja todo Pendiente', () => {
    const { skills } = buildScoreRequirements(
      { skills: ['Docker', 'AWS'] },
      candidate(),
    );

    expect(skills.every(({ status }) => status === 'Pendiente')).toBe(true);
  });

  it('no modifica las listas que recibe', () => {
    const vacancy: VacancyRequirements = {
      skills: Object.freeze(['Docker', 'docker']),
    };
    const profile = candidate({ skills: Object.freeze(['docker']) });

    expect(() => buildScoreRequirements(vacancy, profile)).not.toThrow();
    expect(vacancy.skills).toEqual(['Docker', 'docker']);
  });
});

describe('buildScoreRequirements: solo habilidades', () => {
  const vacancyWithOtherRequirements: VacancyRequirements = {
    skills: ['Docker'],
    careers: ['Ingeniería de Sistemas'],
    minExperienceYears: 5,
    others: ['Carta de motivación'],
  };

  it('no crea requisitos de carrera, experiencia ni otros aunque la vacante los traiga', () => {
    const requirements = buildScoreRequirements(
      vacancyWithOtherRequirements,
      candidate({ skills: ['Docker'] }),
    );

    expect(requirements.academicRequirements).toEqual([]);
    expect(requirements.experienceRequirements).toEqual([]);
    expect(requirements.otherRequirements).toEqual([]);
  });

  it('el perfil con otra carrera, pocos años y sin entregas no cambia el resultado', () => {
    const matching = buildScoreRequirements(
      vacancyWithOtherRequirements,
      candidate({
        skills: ['Docker'],
        career: 'Ingeniería Comercial',
        experienceYears: 0,
        presentedOthers: [],
      }),
    );
    const plain = buildScoreRequirements(
      { skills: ['Docker'] },
      candidate({ skills: ['Docker'] }),
    );

    expect(matching).toEqual(plain);
    expect(calculateWeightedScore(matching)).toBe(100);
  });
});

describe('toCategorizedRequirements y hasPendingRequirements', () => {
  const vacancy: VacancyRequirements = {
    skills: ['Docker', 'Terraform'],
    careers: ['Ingeniería de Sistemas'],
    minExperienceYears: 2,
    others: ['Carta de motivación'],
  };

  it('lista solo las habilidades, con su categoría', () => {
    const requirements = buildScoreRequirements(
      vacancy,
      candidate({
        skills: ['Docker'],
        career: 'Ingeniería de Sistemas',
        experienceYears: 1,
      }),
    );

    expect(toCategorizedRequirements(requirements)).toEqual([
      { name: 'Docker', status: 'Cumple', category: 'skill' },
      { name: 'Terraform', status: 'Pendiente', category: 'skill' },
    ]);
  });

  it('informa si queda alguna habilidad pendiente', () => {
    const missing = buildScoreRequirements(
      vacancy,
      candidate({ skills: ['Docker'] }),
    );
    const complete = buildScoreRequirements(
      vacancy,
      candidate({ skills: ['Docker', 'Terraform'] }),
    );

    expect(hasPendingRequirements(missing)).toBe(true);
    expect(hasPendingRequirements(complete)).toBe(false);
  });

  it('una vacante sin requisitos no tiene pendientes y da 100 % (brecha cero, AC-03.5)', () => {
    const requirements = buildScoreRequirements(
      { skills: [] },
      candidate({ skills: ['Docker'] }),
    );

    expect(toCategorizedRequirements(requirements)).toEqual([]);
    expect(hasPendingRequirements(requirements)).toBe(false);
    expect(calculateWeightedScore(requirements)).toBe(100);
  });

  it('cumplir todas las habilidades da 100 % y no cumplir ninguna da 0 % (AC-03.5)', () => {
    const all = buildScoreRequirements(
      vacancy,
      candidate({ skills: ['Docker', 'Terraform'] }),
    );
    const none = buildScoreRequirements(vacancy, candidate());

    expect(calculateWeightedScore(all)).toBe(100);
    expect(calculateWeightedScore(none)).toBe(0);
  });

  it('el porcentaje es el de habilidades cumplidas sobre las pedidas', () => {
    const requirements = buildScoreRequirements(
      vacancy,
      candidate({ skills: ['Docker'] }),
    );

    expect(calculateWeightedScore(requirements)).toBe(50);
  });
});
