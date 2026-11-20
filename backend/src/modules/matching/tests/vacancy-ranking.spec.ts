import { describe, expect, it } from 'vitest';
import { VacancyRankingService } from '../services/vacancy-ranking.service.js';
import { compareVacancyRank } from '../utils/compare-vacancy-rank.js';

const day = (value: number) =>
  new Date(`2026-10-${String(value).padStart(2, '0')}T12:00:00.000Z`);

describe('HU-06 T2.3 - Vacancy ranking', () => {
  const service = new VacancyRankingService();

  it('sorts vacancies by compatibility percentage descending', () => {
    const vacancies = [
      { id: 'low', compatibility: 60, publishedAt: day(1) },
      { id: 'high', compatibility: 95, publishedAt: day(1) },
      { id: 'medium', compatibility: 80, publishedAt: day(1) },
    ];

    expect(service.rank(vacancies).map(({ id }) => id)).toEqual([
      'high',
      'medium',
      'low',
    ]);
  });

  it('AC-06.2: lists the most recently published first when the percentage is equal', () => {
    const vacancies = [
      { id: 'older', compatibility: 85, publishedAt: day(1) },
      { id: 'newest', compatibility: 85, publishedAt: day(20) },
      { id: 'middle', compatibility: 85, publishedAt: day(10) },
    ];

    expect(service.rank(vacancies).map(({ id }) => id)).toEqual([
      'newest',
      'middle',
      'older',
    ]);
  });

  it('keeps a higher percentage first even when it was published earlier', () => {
    const vacancies = [
      { id: 'recent-lower', compatibility: 70, publishedAt: day(20) },
      { id: 'older-higher', compatibility: 90, publishedAt: day(1) },
    ];

    expect(service.rank(vacancies).map(({ id }) => id)).toEqual([
      'older-higher',
      'recent-lower',
    ]);
  });

  it('uses the id as the last criterion so the order is always the same', () => {
    const vacancies = [
      { id: 'b', compatibility: 85, publishedAt: day(5) },
      { id: 'a', compatibility: 85, publishedAt: day(5) },
    ];

    expect(service.rank(vacancies).map(({ id }) => id)).toEqual(['a', 'b']);
    expect(service.rank([...vacancies].reverse()).map(({ id }) => id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('does not mutate the original vacancy list', () => {
    const vacancies = [
      { id: 'low', compatibility: 60, publishedAt: day(1) },
      { id: 'high', compatibility: 95, publishedAt: day(1) },
    ];

    service.rank(vacancies);

    expect(vacancies.map(({ id }) => id)).toEqual(['low', 'high']);
  });

  it('returns an empty list when no vacancies are provided', () => {
    expect(service.rank([])).toEqual([]);
  });

  it('returns zero from the comparator for the same vacancy', () => {
    const rank = { id: 'same', compatibility: 85, publishedAt: day(3) };

    expect(compareVacancyRank(rank, rank)).toBe(0);
  });
});
