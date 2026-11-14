// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  formatRegistrationDate,
  formatRegistrationTime,
  formatRegistrationTimeAmPm,
  formatRegistrationTimeRangeAmPm,
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
  it.each([
    ['00:00', '12:00 AM'],
    ['09:05', '09:05 AM'],
    ['12:00', '12:00 PM'],
    ['15:30', '03:30 PM'],
    ['23:59', '11:59 PM'],
  ])('formatea %s con indicador AM/PM', (time, expected) => {
    expect(formatRegistrationTimeAmPm(time)).toBe(expected);
  });
  it('formatea el rango horario del pase con indicadores AM/PM', () => {
    expect(
      formatRegistrationTimeRangeAmPm(
        '1970-01-01T09:00:00.000Z',
        '1970-01-01T12:00:00.000Z',
      ),
    ).toBe('09:00 AM - 12:00 PM');
  });
  it('informa si el rango horario del pase no está disponible', () => {
    expect(formatRegistrationTimeRangeAmPm('invalid', '12:00')).toBe(
      'Horario no disponible',
    );
  });
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
  });
});
