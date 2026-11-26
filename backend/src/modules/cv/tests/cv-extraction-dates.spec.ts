import { describe, expect, it } from 'vitest';
import { parseCvDateRange } from '../utils/parse-cv-date-range.js';
import { toCvIsoDate } from '../utils/to-cv-iso-date.js';

describe('parseCvDateRange', () => {
  it.each([
    ['Marzo 2019 - Actualidad', '2019-03-01', null, true],
    ['ene. 2020 – dic. 2022', '2020-01-01', '2022-12-01', false],
    ['2018 - 2020', '2018-01-01', '2020-01-01', false],
    ['03/2017 - 11/2019', '2017-03-01', '2019-11-01', false],
    ['Agosto de 2021 a la fecha', '2021-08-01', null, true],
    ['Jan 2015 to Present', '2015-01-01', null, true],
  ])('parses "%s"', (line, startDate, endDate, isCurrent) => {
    expect(parseCvDateRange(line)?.range).toEqual({
      startDate,
      endDate,
      isCurrent,
    });
  });

  it('keeps the text that surrounds the date range', () => {
    expect(
      parseCvDateRange('Desarrollador Backend | Empresa SRL | 2020 - 2022')
        ?.remainder,
    ).toBe('Desarrollador Backend | Empresa SRL');
  });

  it('ignores a single year unless it is allowed', () => {
    expect(parseCvDateRange('Licenciatura 2015')).toBeNull();
    expect(parseCvDateRange('Licenciatura 2015', true)).toEqual({
      range: { startDate: null, endDate: '2015-01-01', isCurrent: false },
      remainder: 'Licenciatura',
    });
  });

  it('returns null for lines without dates', () => {
    expect(parseCvDateRange('Trabajo en equipo', true)).toBeNull();
  });
});

describe('toCvIsoDate', () => {
  it('rejects years outside the accepted window', () => {
    expect(toCvIsoDate('1900', 1, 2026)).toBeNull();
    expect(toCvIsoDate('2099', 1, 2026)).toBeNull();
  });

  it('defaults to the first month of the year', () => {
    expect(toCvIsoDate('2019', undefined, 2026)).toBe('2019-01-01');
  });
});
