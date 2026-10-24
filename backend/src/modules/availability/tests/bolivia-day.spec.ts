import { describe, expect, it } from 'vitest';
import {
  getBoliviaDayRange,
  getBoliviaToday,
  getLastBoliviaDay,
  toCalendarDate,
  toDayString,
} from '../utils/bolivia-day.js';

describe('bolivia-day utils', () => {
  it('convierte un día AAAA-MM-DD a la fecha de calendario que guarda Postgres', () => {
    expect(toCalendarDate('2026-10-27').toISOString()).toBe('2026-10-27T00:00:00.000Z');
    expect(toDayString(new Date('2026-10-27T00:00:00.000Z'))).toBe('2026-10-27');
  });

  it('devuelve el día de Bolivia como rango UTC de 04:00Z a 04:00Z del día siguiente', () => {
    const { startAt, endAt } = getBoliviaDayRange('2026-10-27');
    expect(startAt.toISOString()).toBe('2026-10-27T04:00:00.000Z');
    expect(endAt.toISOString()).toBe('2026-10-28T04:00:00.000Z');
  });

  it('usa la fecha de Bolivia para hoy aunque en UTC ya sea el día siguiente', () => {
    expect(getBoliviaToday(new Date('2026-10-28T02:00:00.000Z'))).toBe('2026-10-27');
    expect(getBoliviaToday(new Date('2026-10-28T04:00:00.000Z'))).toBe('2026-10-28');
  });

  it('toma el último día de un rango semiabierto', () => {
    expect(getLastBoliviaDay(new Date('2026-11-02T03:59:59.999Z'))).toBe('2026-11-01');
    expect(getLastBoliviaDay(new Date('2026-11-02T04:00:00.000Z'))).toBe('2026-11-01');
  });
});
