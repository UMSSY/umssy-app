import { describe, expect, it } from 'vitest';
import { calculateExperienceYears } from '../utils/calculate-experience-years.js';

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const NOW = date('2026-10-24');

function period(startDate: string, endDate: string | null, isCurrent = false) {
  return {
    startDate: date(startDate),
    endDate: endDate === null ? null : date(endDate),
    isCurrent,
  };
}

describe('calculateExperienceYears', () => {
  it('devuelve 0 sin experiencias', () => {
    expect(calculateExperienceYears([], NOW)).toBe(0);
  });

  it('cuenta dos años exactos como 2', () => {
    expect(
      calculateExperienceYears([period('2024-03-01', '2026-03-01')], NOW),
    ).toBe(2);
  });

  it('usa la fecha actual cuando el trabajo es actual', () => {
    expect(
      calculateExperienceYears(
        [period('2023-01-01', null, true)],
        date('2026-01-15'),
      ),
    ).toBe(3);
  });

  it('no suma dos veces los periodos que se solapan', () => {
    expect(
      calculateExperienceYears(
        [
          period('2023-01-01', '2024-01-01'),
          period('2023-07-01', '2024-07-01'),
        ],
        NOW,
      ),
    ).toBe(1.5);
  });

  it('suma los periodos separados', () => {
    expect(
      calculateExperienceYears(
        [
          period('2020-01-01', '2021-01-01'),
          period('2022-01-01', '2023-01-01'),
        ],
        NOW,
      ),
    ).toBe(2);
  });

  it('ignora los periodos con fechas invertidas', () => {
    expect(
      calculateExperienceYears([period('2025-01-01', '2024-01-01')], NOW),
    ).toBe(0);
  });
});
