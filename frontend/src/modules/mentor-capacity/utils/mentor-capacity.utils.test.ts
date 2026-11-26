import { describe, expect, it } from 'vitest';
import {
  BOLIVIA_TIME_ZONE,
  formatMentorCapacityDate,
  percentageForCapacity,
  validatePercentage,
} from './mentor-capacity.utils';

describe('mentor capacity utilities', () => {
  it('formats dates in the Bolivia time zone', () => {
    const value = '2026-11-20T14:30:00.000Z';
    const result = formatMentorCapacityDate(value);
    const boliviaHour = new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      hour12: false,
      timeZone: BOLIVIA_TIME_ZONE,
    }).format(new Date(value));

    expect(boliviaHour).toBe('10');
    expect(result).toContain('10:30');
  });

  it('validates integer percentages between 1 and 100', () => {
    expect(validatePercentage('25')).toBeNull();
    expect(validatePercentage('25.5')).toBe(
      'Ingresa un porcentaje entero entre 1 y 100.',
    );
    expect(validatePercentage('0')).toBe(
      'El porcentaje debe estar entre 1 y 100.',
    );
  });

  it('converts capacity to an exact integer percentage', () => {
    expect(percentageForCapacity('30', 100)).toEqual({ percentage: 30 });
    expect(percentageForCapacity('121', 341)).toEqual({
      error:
        'No hay un porcentaje entero que produzca exactamente esa cantidad de cupos.',
    });
  });
});
