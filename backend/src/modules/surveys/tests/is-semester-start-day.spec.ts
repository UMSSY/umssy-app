import { describe, expect, it } from 'vitest';

import { getSemesterStartDay } from '../utils/is-semester-start-day.js';

describe('getSemesterStartDay', () => {
  it('reconoce el 1 de julio en Bolivia', () => {
    expect(getSemesterStartDay(new Date('2026-07-01T04:00:00Z'))).toBe(
      '2026-07-01',
    );
    expect(getSemesterStartDay(new Date('2026-07-01T23:59:00Z'))).toBe(
      '2026-07-01',
    );
  });

  it('reconoce el 1 de enero en Bolivia', () => {
    expect(getSemesterStartDay(new Date('2027-01-01T04:00:00Z'))).toBe(
      '2027-01-01',
    );
  });

  it('respeta la medianoche de Bolivia (UTC-4)', () => {
    expect(getSemesterStartDay(new Date('2026-07-01T03:59:00Z'))).toBeNull();
    expect(getSemesterStartDay(new Date('2026-07-02T03:59:00Z'))).toBe(
      '2026-07-01',
    );
    expect(getSemesterStartDay(new Date('2026-07-02T04:00:00Z'))).toBeNull();
  });

  it.each([
    '2026-07-02T15:00:00Z',
    '2026-11-16T15:00:00Z',
    '2026-02-01T15:00:00Z',
    '2026-06-01T15:00:00Z',
  ])('devuelve null en un día común (%s)', (iso) => {
    expect(getSemesterStartDay(new Date(iso))).toBeNull();
  });

  it('devuelve null con una fecha inválida', () => {
    expect(getSemesterStartDay(new Date('no-es-fecha'))).toBeNull();
  });
});
