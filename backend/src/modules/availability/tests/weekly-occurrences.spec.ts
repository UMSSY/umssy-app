import { describe, expect, it } from 'vitest';
import { weeklyOccurrences } from '../utils/weekly-occurrences.js';

describe('weeklyOccurrences', () => {
  const startAt = new Date('2026-12-21T13:00:00Z');
  const endAt = new Date('2026-12-21T14:30:00Z');

  it('genera cuatro semanas atravesando el año y conserva el horario y duración', () => {
    const occurrences = [...weeklyOccurrences(startAt, endAt, '2027-01-11')];
    expect(occurrences.map((item) => item.day)).toEqual([
      '2026-12-21', '2026-12-28', '2027-01-04', '2027-01-11',
    ]);
    for (const occurrence of occurrences) {
      expect(occurrence.startAt.getUTCHours()).toBe(13);
      expect(occurrence.endAt.getTime() - occurrence.startAt.getTime()).toBe(90 * 60_000);
    }
    expect(startAt.toISOString()).toBe('2026-12-21T13:00:00.000Z');
  });

  it('no incluye una ocurrencia posterior a un fin entre semanas', () => {
    expect([...weeklyOccurrences(startAt, endAt, '2026-12-30')]).toHaveLength(2);
  });

  it('incluye una única ocurrencia si el fin es el día inicial de Bolivia', () => {
    expect([...weeklyOccurrences(
      new Date('2026-12-22T00:00:00Z'),
      new Date('2026-12-22T01:00:00Z'),
      '2026-12-21',
    )]).toHaveLength(1);
  });
});
