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

describe('buildScoreRequirements: académicos, experiencia y otros (AC-04.1, AC-04.5, AC-04.6)', () => {
  it('sin datos de carrera, experiencia ni otros no crea esos requisitos', () => {
    const requirements = buildScoreRequirements(
      { skills: ['Docker'] },
      candidate({ skills: ['Docker'] }),
    );

    expect(requirements.academicRequirements).toEqual([]);
    expect(requirements.experienceRequirements).toEqual([]);
    expect(requirements.otherRequirements).toEqual([]);
  });

  it('cumple la carrera con cualquiera de las aceptadas, sin distinguir tildes ni mayúsculas', () => {
    const { academicRequirements } = buildScoreRequirements(
      {
        skills: [],
        careers: ['Ingeniería de Sistemas', 'Ingeniería Informática'],
      },
      candidate({ career: '  ingenieria informatica ' }),
    );

    expect(academicRequirements).toEqual([
      {
        name: 'Ingeniería de Sistemas o Ingeniería Informática',
        status: 'Cumple',
      },
    ]);
  });

  it.each([['Ingeniería Comercial'], [''], [null], [undefined]])(
    'una carrera distinta o vacía (%o) deja el requisito académico Pendiente',
    (career) => {
      const { academicRequirements } = buildScoreRequirements(
        { skills: [], careers: ['Ingeniería de Sistemas'] },
        candidate({ career }),
      );

      expect(academicRequirements).toEqual([
        { name: 'Ingeniería de Sistemas', status: 'Pendiente' },
      ]);
    },
  );

  it.each([
    [2, 3, 'Experiencia mínima: 2 años', 'Cumple'],
    [2, 2, 'Experiencia mínima: 2 años', 'Cumple'],
    [2, 1.5, 'Experiencia mínima: 2 años', 'Pendiente'],
    [2, null, 'Experiencia mínima: 2 años', 'Pendiente'],
    [1, 0, 'Experiencia mínima: 1 año', 'Pendiente'],
  ])(
    'con %p años pedidos y %p del perfil: "%s" es %s',
    (minYears, years, name, status) => {
      const { experienceRequirements } = buildScoreRequirements(
        { skills: [], minExperienceYears: minYears },
        candidate({ experienceYears: years }),
      );

      expect(experienceRequirements).toEqual([{ name, status }]);
    },
  );

  it.each([[0], [-1], [null], [undefined], [Number.NaN]])(
    'no crea requisito de experiencia con %p años',
    (minYears) => {
      const { experienceRequirements } = buildScoreRequirements(
        { skills: [], minExperienceYears: minYears },
        candidate({ experienceYears: 10 }),
      );

      expect(experienceRequirements).toEqual([]);
    },
  );

  it('los otros requisitos quedan Pendiente mientras la persona no los haya presentado', () => {
    const { otherRequirements } = buildScoreRequirements(
      { skills: [], others: ['Carta de motivación', 'Carta de recomendación'] },
      candidate({ presentedOthers: ['carta de motivacion'] }),
    );

    expect(otherRequirements).toEqual([
      { name: 'Carta de motivación', status: 'Cumple' },
      { name: 'Carta de recomendación', status: 'Pendiente' },
    ]);
  });

  it('sin entregas registradas todos los otros requisitos son Pendiente', () => {
    const { otherRequirements } = buildScoreRequirements(
      { skills: [], others: ['Carta de motivación'] },
      candidate(),
    );

    expect(otherRequirements).toEqual([
      { name: 'Carta de motivación', status: 'Pendiente' },
    ]);
  });
});

describe('toCategorizedRequirements y hasPendingRequirements', () => {
  const vacancy: VacancyRequirements = {
    skills: ['Docker', 'Terraform'],
    careers: ['Ingeniería de Sistemas'],
    minExperienceYears: 2,
    others: ['Carta de motivación'],
  };

  it('lista habilidades, académicos (carrera y experiencia) y otros, en ese orden, con su categoría', () => {
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
      {
        name: 'Ingeniería de Sistemas',
        status: 'Cumple',
        category: 'academic',
      },
      {
        name: 'Experiencia mínima: 2 años',
        status: 'Pendiente',
        category: 'academic',
      },
      { name: 'Carta de motivación', status: 'Pendiente', category: 'other' },
    ]);
  });

  it('informa si queda algún requisito pendiente', () => {
    const missing = buildScoreRequirements(
      vacancy,
      candidate({ skills: ['Docker'] }),
    );
    const complete = buildScoreRequirements(
      vacancy,
      candidate({
        skills: ['Docker', 'Terraform'],
        career: 'Ingeniería de Sistemas',
        experienceYears: 3,
        presentedOthers: ['Carta de motivación'],
      }),
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

  it('cumplir todo da 100 % y no cumplir nada da 0 % (AC-03.5)', () => {
    const all = buildScoreRequirements(
      vacancy,
      candidate({
        skills: ['Docker', 'Terraform'],
        career: 'Ingeniería de Sistemas',
        experienceYears: 2,
        presentedOthers: ['Carta de motivación'],
      }),
    );
    const none = buildScoreRequirements(vacancy, candidate());

    expect(calculateWeightedScore(all)).toBe(100);
    expect(calculateWeightedScore(none)).toBe(0);
  });
});
