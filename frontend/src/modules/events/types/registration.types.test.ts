// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  formatRegistrationDate,
  formatRegistrationDisplayTime,
  formatRegistrationTime,
  formatRegistrationTimeRange,
  getRegistrationEventTimestamp,
  getFinishedRegistrationPresentation,
} from '../utils/registration-format';

describe('formato de datos del pase', () => {
  it.each(['1970-01-01T09:30:00.000Z', '09:30', '09:30:00', '09:30:00.000'])(
    'formatea el horario %s',
    (time) => {
      expect(formatRegistrationTime(time)).toBe('09:30');
    },
  );
  it.each([undefined, null, '', 'invalid', '24:00', '09:60', '09:30:60'])(
    'no rompe el pase con horario ausente o inválido: %s',
    (time) => {
      expect(formatRegistrationTime(time)).toBe('Horario no disponible');
    },
  );
  it.each([undefined, null, '', 'invalid'])(
    'no rompe el pase con fecha ausente o inválida: %s',
    (date) => {
      expect(formatRegistrationDate(date)).toBe('Fecha no disponible');
    },
  );
  it('conserva la fecha del evento sin desplazarla por zona horaria', () => {
    expect(formatRegistrationDate('2026-10-20T00:00:00Z')).toContain(
      '20 de octubre de 2026',
    );
    expect(formatRegistrationDate('2025-11-14')).toBe(
      'viernes, 14 de noviembre de 2025',
    );
  });
  it('muestra la hora de los pases con AM o PM', () => {
    expect(formatRegistrationDisplayTime('09:00')).toBe('09:00 AM');
    expect(formatRegistrationDisplayTime('1970-01-01T12:00:00Z')).toBe('12:00 PM');
    expect(formatRegistrationTimeRange('09:00', '13:30')).toBe('09:00 AM - 01:30 PM');
  });
  it('calcula el cierre con la fecha y hora de Bolivia incluso al cruzar el día UTC', () => {
    expect(getRegistrationEventTimestamp('2025-11-14', '23:30')).toBe(
      Date.UTC(2025, 10, 15, 3, 30),
    );
  });
  it('preserves seconds and milliseconds for exact event transitions', () => {
    expect(
      getRegistrationEventTimestamp(
        '2025-11-14',
        '1970-01-01T22:05:20.123Z',
      ),
    ).toBe(Date.UTC(2025, 10, 15, 2, 5, 20, 123));
  });
  it('presents finished history without changing registration status', () => {
    expect(getFinishedRegistrationPresentation()).toEqual({ label: 'Finalizado', code: 'FINALIZED' });
    expect(formatRegistrationDate('2026-09-20')).toContain('20 de septiembre de 2026');
  });
});
