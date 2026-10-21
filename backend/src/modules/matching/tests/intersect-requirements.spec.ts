import { describe, expect, it } from 'vitest';
import { MatchingService } from '../services/matching.service.js';
import type { MatchingInput } from '../types/matching.types.js';

const BASE_INPUT: MatchingInput = {
  userCareer: 'Ingeniería de Sistemas',
  requiredCareer: 'Ingeniería de Sistemas',
  userExperienceYears: 3,
  minimumExperienceYears: 2,
  userSkills: ['TypeScript', 'PostgreSQL'],
  requiredSkills: ['TypeScript', 'PostgreSQL'],
};

function compare(overrides: Partial<MatchingInput> = {}) {
  const service = Object.create(
    MatchingService.prototype,
  ) as MatchingService;

  return service.intersectRequirements({
    ...BASE_INPUT,
    ...overrides,
  });
}

describe('HU-02A T2.2 - Profile matching', () => {
  it('matches careers ignoring surrounding spaces and case', () => {
    const result = compare({
      userCareer: ' ingeniería de sistemas ',
    });

    expect(result.careerMatch).toBe(true);
  });

  it('rejects different careers', () => {
    const result = compare({
      userCareer: 'Ingeniería Comercial',
    });

    expect(result.careerMatch).toBe(false);
  });

  it('rejects insufficient experience', () => {
    const result = compare({
      userExperienceYears: 2,
      minimumExperienceYears: 3,
    });

    expect(result.experienceMatch).toBe(false);
  });

  it('accepts sufficient experience', () => {
    const result = compare({
      userExperienceYears: 4,
      minimumExperienceYears: 3,
    });

    expect(result.experienceMatch).toBe(true);
  });

  it('matches skills ignoring surrounding spaces and case', () => {
    const result = compare({
      userSkills: [' typescript ', 'POSTGRESQL'],
    });

    expect(result.matchedSkills).toEqual([
      'TypeScript',
      'PostgreSQL',
    ]);
    expect(result.allRequiredSkillsMatch).toBe(true);
  });

  it('identifies partial skill matches', () => {
    const result = compare({
      userSkills: ['TypeScript'],
    });

    expect(result.matchedSkills).toEqual(['TypeScript']);
    expect(result.allRequiredSkillsMatch).toBe(false);
  });
  it('rejects an empty candidate career when a career is required', () => {
    const result = compare({
      userCareer: '   ',
      requiredCareer: 'Ingeniería de Sistemas',
    });

    expect(result.careerMatch).toBe(false);
  });

  it('does not confuse Java with JavaScript', () => {
    const result = compare({
      userSkills: ['JavaScript'],
      requiredSkills: ['Java'],
    });

    expect(result.matchedSkills).toEqual([]);
    expect(result.allRequiredSkillsMatch).toBe(false);
  });

  it('rejects different careers even with extra spaces', () => {
    const result = compare({
      userCareer: '  Ingeniería Comercial  ',
      requiredCareer: 'Ingeniería de Sistemas',
    });

    expect(result.careerMatch).toBe(false);
  });
  it.each([
    ['Ingeniería Informática', 'Ingeniería de Sistemas'],
    ['Ingeniería de Sistemas', 'Ingeniería Informática'],
  ])(
    'does not match different UMSS careers: %s vs %s',
    (userCareer, requiredCareer) => {
      const result = compare({ userCareer, requiredCareer });

      expect(result.careerMatch).toBe(false);
    },
  );
  it.each([
    ['Ingeniería Informática', 'Ingenieria Informatica'],
    ['Ingeniería de Sistemas', 'Ingenieria de Sistemas'],
  ])(
    'matches the same career with and without accents: %s vs %s',
    (userCareer, requiredCareer) => {
      const result = compare({ userCareer, requiredCareer });

      expect(result.careerMatch).toBe(true);
    },
  );

  it('matches skills ignoring accents', () => {
    const result = compare({
      userSkills: ['Análisis de datos'],
      requiredSkills: ['Analisis de datos'],
    });

    expect(result.matchedSkills).toEqual(['Analisis de datos']);
    expect(result.allRequiredSkillsMatch).toBe(true);
  });
});
