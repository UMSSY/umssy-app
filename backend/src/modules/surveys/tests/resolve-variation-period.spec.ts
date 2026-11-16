import { describe, expect, it } from 'vitest';

import { resolveVariationPeriod } from '../utils/resolve-variation-period.js';

const NOW = new Date('2026-11-16T15:00:00.000Z');

describe('resolveVariationPeriod', () => {
  it('conserva la gestión cuando ya es un semestre válido', () => {
    expect(resolveVariationPeriod({ academicPeriod: 'II-2024', now: NOW })).toBe(
      'II-2024',
    );
  });

  it.each(['2020', 'Todas', ''])(
    'ignora la gestión "%s" porque no es un semestre y usa la fecha de cierre',
    (academicPeriod) => {
      expect(
        resolveVariationPeriod({
          academicPeriod,
          closesAt: new Date('2026-03-10T15:00:00.000Z'),
          now: NOW,
        }),
      ).toBe('I-2026');
    },
  );

  it('usa la fecha de cierre cuando no hay gestión', () => {
    expect(
      resolveVariationPeriod({
        academicPeriod: null,
        closesAt: new Date('2026-09-01T15:00:00.000Z'),
        now: NOW,
      }),
    ).toBe('II-2026');
  });

  it('usa la fecha actual cuando no hay gestión ni fecha de cierre', () => {
    expect(resolveVariationPeriod({ now: NOW })).toBe('II-2026');
  });

  it('respeta el límite entre semestres en hora de Bolivia', () => {
    expect(
      resolveVariationPeriod({
        closesAt: new Date('2026-07-01T03:30:00.000Z'),
      }),
    ).toBe('I-2026');
    expect(
      resolveVariationPeriod({
        closesAt: new Date('2026-07-01T04:10:00.000Z'),
      }),
    ).toBe('II-2026');
  });
});
