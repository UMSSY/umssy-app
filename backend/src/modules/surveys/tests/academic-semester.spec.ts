import { describe, expect, it } from 'vitest';
import {
  getPreviousSemester,
  getSemesterRange,
  listSemesters,
} from '../utils/academic-semester.js';

describe('getSemesterRange', () => {
  it('el primer semestre va de enero a junio en hora de Bolivia', () => {
    const range = getSemesterRange('I-2026');

    expect(range?.start.toISOString()).toBe('2026-01-01T04:00:00.000Z');
    expect(range?.end.toISOString()).toBe('2026-07-01T04:00:00.000Z');
  });

  it('el segundo semestre va de julio a diciembre y termina al empezar el año siguiente', () => {
    const range = getSemesterRange('II-2026');

    expect(range?.start.toISOString()).toBe('2026-07-01T04:00:00.000Z');
    expect(range?.end.toISOString()).toBe('2027-01-01T04:00:00.000Z');
  });

  it('un semestre empieza justo donde termina el anterior', () => {
    expect(getSemesterRange('II-2025')?.end).toEqual(
      getSemesterRange('I-2026')?.start,
    );
    expect(getSemesterRange('I-2026')?.end).toEqual(
      getSemesterRange('II-2026')?.start,
    );
  });

  it('rechaza valores que no son un semestre', () => {
    expect(getSemesterRange('2026')).toBeUndefined();
    expect(getSemesterRange('III-2026')).toBeUndefined();
    expect(getSemesterRange('')).toBeUndefined();
  });
});

describe('getPreviousSemester', () => {
  it('el segundo semestre sigue al primero del mismo año', () => {
    expect(getPreviousSemester('II-2026')).toBe('I-2026');
  });

  it('el primer semestre sigue al segundo del año anterior', () => {
    expect(getPreviousSemester('I-2026')).toBe('II-2025');
  });

  it('devuelve undefined si no es un semestre', () => {
    expect(getPreviousSemester('2026')).toBeUndefined();
  });
});

describe('listSemesters', () => {
  it('devuelve un solo semestre si las fechas están dentro del mismo', () => {
    expect(
      listSemesters(
        new Date('2026-10-27T12:00:00Z'),
        new Date('2026-11-03T12:00:00Z'),
      ),
    ).toEqual(['II-2026']);
  });

  it('lista los semestres del más reciente al más antiguo, cruzando de año', () => {
    expect(
      listSemesters(
        new Date('2025-09-01T12:00:00Z'),
        new Date('2026-08-01T12:00:00Z'),
      ),
    ).toEqual(['II-2026', 'I-2026', 'II-2025']);
  });

  it('usa la fecha de Bolivia: el 1 de julio de madrugada en UTC todavía es junio allá', () => {
    expect(
      listSemesters(
        new Date('2026-06-01T12:00:00Z'),
        new Date('2026-07-01T02:00:00Z'),
      ),
    ).toEqual(['I-2026']);
  });

  it('devuelve una lista vacía si las fechas no son válidas', () => {
    expect(
      listSemesters(new Date('invalid'), new Date('2026-01-01T00:00:00Z')),
    ).toEqual([]);
  });

  it('limita la cantidad de semestres para rangos muy largos', () => {
    expect(
      listSemesters(
        new Date('1990-01-15T12:00:00Z'),
        new Date('2026-11-01T12:00:00Z'),
      ).length,
    ).toBeLessThanOrEqual(40);
  });
});
