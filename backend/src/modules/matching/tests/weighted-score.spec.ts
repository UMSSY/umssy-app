import { describe, expect, it } from 'vitest';
import { calculateWeightedScore } from '../utils/calculate-weighted-score.js';
import type { RequirementState } from '../types/requirement-state.types.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';
import { buildScoreRequirements } from '../utils/build-score-requirements.js';
import {
  MATCH_SCORE_WEIGHTS,
  type MatchScoreWeights,
} from '../constants/match-score.constants.js';


const met: RequirementState = { name: 'Met', status: 'Cumple' };
const pending: RequirementState = { name: 'Pending', status: 'Pendiente' };


describe('Match score: pruebas de estrés matemático y pesos parametrizables (T3.3)', () => {
  const emptyRequirements = {
    skills: [],
    academicRequirements: [],
    experienceRequirements: [],
    otherRequirements: [],
  };
  const equalWeights: MatchScoreWeights = {
    skills: 1,
    academicRequirements: 1,
    experienceRequirements: 1,
    otherRequirements: 1,
  };
  const skillsOnly = (fulfilled: number, total: number): RequirementState[] =>
    Array.from({ length: total }, (_, index) =>
      index < fulfilled ? met : pending,
    );

  it.each([
    [0, 4, 0],
    [1, 8, 13],
    [1, 3, 33],
    [2, 4, 50],
    [2, 3, 67],
    [4, 4, 100],
  ])(
    'con %i de %i habilidades cumplidas el puntaje es %i',
    (fulfilled, total, expected) => {
      expect(
        calculateWeightedScore({
          ...emptyRequirements,
          skills: skillsOnly(fulfilled, total),
        }),
      ).toBe(expected);
    },
  );

  it('una vacante sin requisitos da 100 con los pesos por defecto y con pesos propios', () => {
    expect(calculateWeightedScore(emptyRequirements)).toBe(100);
    expect(calculateWeightedScore(emptyRequirements, equalWeights)).toBe(100);
  });

  it('un perfil sin habilidades frente a una vacante que las pide da 0', () => {
    const requirements = buildScoreRequirements(
      { skills: ['Docker', 'Kubernetes', 'AWS'] },
      { skills: [] },
    );
    expect(calculateWeightedScore(requirements)).toBe(0);
  });

  it('un perfil sobrecalificado no pasa de 100 ni cambia el resultado', () => {
    const vacancy = { skills: ['Python'] };
    const exact = buildScoreRequirements(vacancy, { skills: ['Python'] });
    const overqualified = buildScoreRequirements(vacancy, {
      skills: ['Python', 'Docker', 'AWS', 'Terraform', 'Go', 'Rust', 'SQL'],
    });
    expect(calculateWeightedScore(overqualified)).toBe(100);
    expect(calculateWeightedScore(overqualified)).toBe(
      calculateWeightedScore(exact),
    );
  });

  it('es determinista: las mismas entradas dan siempre el mismo puntaje y no se modifican', () => {
    const requirements = Object.freeze({
      skills: Object.freeze([met, pending, met]),
      academicRequirements: Object.freeze([met]),
      experienceRequirements: Object.freeze([pending]),
      otherRequirements: Object.freeze([pending]),
    });
    const results = new Set(
      Array.from({ length: 50 }, () => calculateWeightedScore(requirements)),
    );
    expect(results.size).toBe(1);
    expect([...results][0]).toBe(65);
  });

  it('con pesos distintos el mismo perfil da otro puntaje', () => {
    const requirements = {
      ...emptyRequirements,
      skills: [met],
      academicRequirements: [pending],
    };
    expect(calculateWeightedScore(requirements)).toBe(71);
    expect(calculateWeightedScore(requirements, equalWeights)).toBe(50);
    expect(
      calculateWeightedScore(requirements, { ...equalWeights, skills: 100 }),
    ).toBe(99);
    expect(
      calculateWeightedScore(requirements, {
        ...MATCH_SCORE_WEIGHTS,
        skills: 0,
      }),
    ).toBe(0);
  });

  it('sólo importa la proporción entre pesos, no su escala', () => {
    const requirements = {
      ...emptyRequirements,
      skills: [met, pending],
      otherRequirements: [met],
    };
    const scaled: MatchScoreWeights = {
      skills: 6000,
      academicRequirements: 2500,
      experienceRequirements: 1000,
      otherRequirements: 500,
    };
    expect(calculateWeightedScore(requirements, scaled)).toBe(
      calculateWeightedScore(requirements),
    );
  });

  it('si los pesos de las categorías con requisitos suman 0, trata la vacante como sin requisitos', () => {
    const requirements = { ...emptyRequirements, skills: [pending] };
    expect(
      calculateWeightedScore(requirements, {
        ...MATCH_SCORE_WEIGHTS,
        skills: 0,
      }),
    ).toBe(100);
  });

  it.each([
    ['negativo', -1],
    ['no numérico', Number.NaN],
    ['infinito', Number.POSITIVE_INFINITY],
  ])('rechaza un peso %s', (_label, invalid) => {
    expect(() =>
      calculateWeightedScore(emptyRequirements, {
        ...MATCH_SCORE_WEIGHTS,
        skills: invalid,
      }),
    ).toThrow(RangeError);
  });

  it('el servicio acepta pesos propios por llamada y usa los de por defecto si no se pasan', () => {
    const service = new WeightedScoreService();
    const requirements = {
      ...emptyRequirements,
      skills: [met],
      academicRequirements: [pending],
    };
    expect(service.calculate(requirements)).toBe(71);
    expect(service.calculate(requirements, equalWeights)).toBe(50);
  });

  it('recalcula el puntaje al agregar o quitar una habilidad del perfil (AC-03.7)', () => {
    const vacancy = { skills: ['Docker', 'Kubernetes'] };
    const score = (skills: string[]) =>
      calculateWeightedScore(buildScoreRequirements(vacancy, { skills }));

    expect(score(['Docker'])).toBe(50);
    expect(score(['Docker', 'Kubernetes'])).toBe(100);
    expect(score(['Docker'])).toBe(50);
    expect(score([])).toBe(0);
  });

  it('mantiene un puntaje finito con pesos válidos muy grandes', () => {
    expect(
      calculateWeightedScore(
        { ...emptyRequirements, skills: [met], academicRequirements: [pending] },
        { ...MATCH_SCORE_WEIGHTS, skills: 1e308, academicRequirements: 1e308 },
      ),
    ).toBe(50);
  });
});
