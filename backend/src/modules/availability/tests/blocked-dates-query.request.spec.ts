import { describe, expect, it } from 'vitest';
import { blockedDatesQuerySchema } from '../requests/blocked-dates-query.request.js';

describe('blockedDatesQuerySchema', () => {
  const from = '2026-10-31T00:00:00-04:00';

  it('acepta solo from para consultar todas las fechas posteriores', () => {
    expect(blockedDatesQuerySchema.parse({ from })).toEqual({ from });
  });

  it('conserva los rangos semanales con offsets ISO', () => {
    expect(
      blockedDatesQuerySchema.safeParse({
        from,
        to: '2026-11-07T00:00:00-04:00',
      }).success,
    ).toBe(true);
  });

  it.each([
    {},
    { from: 'invalid' },
    { from, to: 'invalid' },
    { from, to: from },
    { from, to: '2026-10-30T00:00:00-04:00' },
    { from, to: '2026-11-08T00:00:00-04:00' },
    { from, mentorId: 'otro' },
  ])(
    'rechaza consultas inválidas o intentos de cambiar el mentor: %o',
    (query) => {
      expect(blockedDatesQuerySchema.safeParse(query).success).toBe(false);
    },
  );
});
