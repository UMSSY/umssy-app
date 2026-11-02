import { describe, expect, it } from 'vitest';
import { VacancyRankingService } from '../services/vacancy-ranking.service.js';
import { compareVacancyRank } from '../utils/compare-vacancy-rank.js';

describe('HU-02A T2.3 - Vacancy ranking', () => {
  const common = {
    careerMatch: true,
    experienceMatch: true,
    allRequiredSkillsMatch: true,
    matchedSkills: ['TypeScript'],
  };

  const service = new VacancyRankingService();

  it('sorts vacancies by compatibility percentage descending', () => {
    const vacancies = [
      { ...common, id: 'low', compatibility: 60 },
      { ...common, id: 'high', compatibility: 95, careerMatch: false },
      { ...common, id: 'medium', compatibility: 80 },
    ];

    const result = service.rank(vacancies);

    expect(result.map(({ id }) => id)).toEqual([
      'high',
      'medium',
      'low',
    ]);
  });

  it('prioritizes career match when compatibility is equal', () => {
    const vacancies = [
      { ...common, id: 'other-career', careerMatch: false, compatibility: 85 },
      { ...common, id: 'same-career', compatibility: 85 },
    ];

    expect(service.rank(vacancies).map(({ id }) => id)).toEqual([
      'same-career',
      'other-career',
    ]);
  });

  it('prioritizes experience when compatibility and career match are equal', () => {
    const vacancies = [
      { ...common, id: 'less-experience', experienceMatch: false, compatibility: 85 },
      { ...common, id: 'enough-experience', compatibility: 85 },
    ];

    expect(service.rank(vacancies).map(({ id }) => id)).toEqual([
      'enough-experience',
      'less-experience',
    ]);
  });

  it('prioritizes more matching skills when previous criteria are equal', () => {
    const vacancies = [
      { ...common, id: 'one-skill', compatibility: 85 },
      {
        ...common,
        id: 'two-skills',
        compatibility: 85,
        matchedSkills: ['TypeScript', 'PostgreSQL'],
      },
    ];

    expect(service.rank(vacancies).map(({ id }) => id)).toEqual([
      'two-skills',
      'one-skill',
    ]);
  });

  it('preserves the original order on a complete tie', () => {
    const vacancies = [
      { ...common, id: 'first', compatibility: 85 },
      { ...common, id: 'second', compatibility: 85 },
    ];

    expect(service.rank(vacancies).map(({ id }) => id)).toEqual([
      'first',
      'second',
    ]);
  });

  it('does not mutate the original vacancy list', () => {
    const vacancies = [
      { ...common, id: 'low', compatibility: 60 },
      { ...common, id: 'high', compatibility: 95 },
    ];

    service.rank(vacancies);

    expect(vacancies.map(({ id }) => id)).toEqual(['low', 'high']);
  });

  it('returns an empty list when no vacancies are provided', () => {
    expect(service.rank([])).toEqual([]);
  });

  it('returns zero from the comparator on a complete tie', () => {
    const rank = {
      compatibility: 85,
      careerMatch: true,
      experienceMatch: true,
      matchingSkills: 2,
    };

    expect(compareVacancyRank(rank, rank)).toBe(0);
  });
});
