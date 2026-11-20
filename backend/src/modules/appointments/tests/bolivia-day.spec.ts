import { describe, expect, it } from 'vitest';
import { getBoliviaDayRange } from '../utils/bolivia-day.js';

describe('getBoliviaDayRange', () => {
  it('devuelve el día completo en hora de Bolivia (00:00 a 24:00, GMT-4)', () => {
    expect(getBoliviaDayRange(new Date('2026-11-16T15:00:00.000Z'))).toEqual({
      start: new Date('2026-11-16T04:00:00.000Z'),
      end: new Date('2026-11-17T04:00:00.000Z'),
    });
  });

  it('cuenta en el día anterior una hora que en UTC ya es el día siguiente', () => {
    expect(getBoliviaDayRange(new Date('2026-11-17T02:30:00.000Z'))).toEqual({
      start: new Date('2026-11-16T04:00:00.000Z'),
      end: new Date('2026-11-17T04:00:00.000Z'),
    });
  });

  it('incluye la medianoche exacta de Bolivia en el día que empieza', () => {
    expect(getBoliviaDayRange(new Date('2026-11-17T04:00:00.000Z'))).toEqual({
      start: new Date('2026-11-17T04:00:00.000Z'),
      end: new Date('2026-11-18T04:00:00.000Z'),
    });
  });
});
