import { describe, expect, it } from 'vitest';
import { CREATE_BLOCK_MESSAGES as MSG } from '../constants/create-block.constants.js';
import { buildCreateBlockSchema } from '../requests/create-block.request.js';

const FIXED_NOW = new Date('2026-10-01T12:00:00Z');
const schema = buildCreateBlockSchema(() => FIXED_NOW);

const getMessages = (payload: unknown): string[] => {
  const result = schema.safeParse(payload);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

describe('createBlockSchema', () => {
  const weekly = {
    startAt: '2026-10-10T19:00:00Z',
    endAt: '2026-10-10T20:30:00Z',
    repeatWeekly: true,
    repeatUntil: '2026-10-31',
  };

  it.each(['2026-10-10', '2026-10-31', '2027-01-02'])(
    'acepta fin inclusivo hasta las %s (12 semanas desde el bloque)',
    (repeatUntil) =>
      expect(getMessages({ ...weekly, repeatUntil })).toEqual([]),
  );

  it.each(['2026-10-09', '2027-01-03'])(
    'rechaza fin fuera de rango: %s',
    (repeatUntil) =>
      expect(getMessages({ ...weekly, repeatUntil })).toContain(
        MSG.repeatUntilOutOfRange,
      ),
  );

  it.each(['2026-02-30', '31/10/2026', '2026-10-31T00:00:00Z', '', null])(
    'rechaza fecha final inválida: %s',
    (repeatUntil) =>
      expect(schema.safeParse({ ...weekly, repeatUntil }).success).toBe(false),
  );

  it('exige fecha final al repetir', () => {
    expect(getMessages({ ...weekly, repeatUntil: undefined })).toContain(
      MSG.repeatUntilRequired,
    );
  });

  it.each([false, undefined])(
    'rechaza fecha final sin repetición: %s',
    (repeatWeekly) => {
      expect(getMessages({ ...weekly, repeatWeekly })).toContain(
        MSG.repeatNotEnabled,
      );
    },
  );

  it('acepta desactivar la repetición sin fecha final', () => {
    expect(
      getMessages({ ...weekly, repeatWeekly: false, repeatUntil: undefined }),
    ).toEqual([]);
  });

  it('rechaza booleanos enviados como texto', () => {
    expect(schema.safeParse({ ...weekly, repeatWeekly: 'true' }).success).toBe(
      false,
    );
  });

  it('compara con el día de Bolivia aunque el fin esté en el siguiente día UTC', () => {
    expect(
      getMessages({
        startAt: '2026-10-11T00:00:00Z',
        endAt: '2026-10-11T01:30:00Z',
        repeatWeekly: true,
        repeatUntil: '2026-10-10',
      }),
    ).toEqual([]);
  });

  it('acepta un bloque futuro válido (15:00 a 16:30 Bolivia)', () => {
    const result = schema.safeParse({
      startAt: '2026-10-10T19:00:00Z',
      endAt: '2026-10-10T20:30:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('devuelve las fechas ya convertidas a Date', () => {
    const result = schema.safeParse({
      startAt: '2026-10-10T19:00:00Z',
      endAt: '2026-10-10T20:30:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startAt).toBeInstanceOf(Date);
      expect(result.data.endAt).toBeInstanceOf(Date);
    }
  });

  it('acepta horas con desfase explícito -04:00', () => {
    expect(
      getMessages({
        startAt: '2026-10-10T15:00:00-04:00',
        endAt: '2026-10-10T16:30:00-04:00',
      }),
    ).toEqual([]);
  });

  it('acepta el borde 07:00 a 22:00 Bolivia', () => {
    expect(
      getMessages({
        startAt: '2026-10-10T11:00:00Z',
        endAt: '2026-10-11T02:00:00Z',
      }),
    ).toEqual([]);
  });

  it('acepta un rango de 4 h 30 que se divide en tres bloques de 1 h 30', () => {
    expect(
      getMessages({
        startAt: '2026-10-10T14:00:00Z',
        endAt: '2026-10-10T18:30:00Z',
      }),
    ).toEqual([]);
  });

  it.each([
    ['1 h', '2026-10-10T20:00:00Z'],
    ['2 h', '2026-10-10T21:00:00Z'],
    ['30 min', '2026-10-10T19:30:00Z'],
  ])(
    'rechaza un rango de %s que no se divide en bloques de 1 h 30',
    (_case, endAt) => {
      expect(getMessages({ startAt: '2026-10-10T19:00:00Z', endAt })).toEqual([
        MSG.invalidRangeDuration,
      ]);
    },
  );

  it('rechaza fin anterior al inicio', () => {
    expect(
      getMessages({
        startAt: '2026-10-10T20:00:00Z',
        endAt: '2026-10-10T19:00:00Z',
      }),
    ).toEqual([MSG.endBeforeStart]);
  });

  it('rechaza fin igual al inicio', () => {
    expect(
      getMessages({
        startAt: '2026-10-10T19:00:00Z',
        endAt: '2026-10-10T19:00:00Z',
      }),
    ).toEqual([MSG.endBeforeStart]);
  });

  it('rechaza un inicio que ya pasó', () => {
    expect(
      getMessages({
        startAt: '2026-10-01T11:30:00Z',
        endAt: '2026-10-01T13:00:00Z',
      }),
    ).toContain(MSG.startInPast);
  });

  it('rechaza horas fuera de intervalos de 30 minutos', () => {
    expect(
      getMessages({
        startAt: '2026-10-10T19:15:00Z',
        endAt: '2026-10-10T20:45:00Z',
      }),
    ).toContain(MSG.invalidStep);
  });

  it('rechaza un fin fuera de intervalos de 30 minutos', () => {
    expect(
      getMessages({
        startAt: '2026-10-10T19:10:00Z',
        endAt: '2026-10-10T20:40:00Z',
      }),
    ).toContain(MSG.invalidStep);
  });

  it('rechaza un inicio antes de las 07:00 Bolivia', () => {
    expect(
      getMessages({
        startAt: '2026-10-10T10:00:00Z',
        endAt: '2026-10-10T11:30:00Z',
      }),
    ).toEqual([MSG.outOfRange]);
  });

  it('rechaza un fin después de las 22:00 Bolivia', () => {
    expect(
      getMessages({
        startAt: '2026-10-11T01:00:00Z',
        endAt: '2026-10-11T02:30:00Z',
      }),
    ).toEqual([MSG.outOfRange]);
  });

  it('usa dos dígitos en el mensaje de rango', () => {
    expect(MSG.outOfRange).toBe(
      'El horario debe estar entre las 07:00 y las 22:00',
    );
  });

  it('rechaza un bloque que cruza la medianoche de Bolivia', () => {
    expect(
      getMessages({
        startAt: '2026-10-11T01:00:00Z',
        endAt: '2026-10-11T05:30:00Z',
      }),
    ).toEqual([MSG.differentDays]);
  });

  it('rechaza formatos de fecha inválidos', () => {
    expect(
      getMessages({
        startAt: '10/10/2026 15:00',
        endAt: '2026-10-10T20:00:00Z',
      }),
    ).toEqual([MSG.invalidDate]);
  });

  it('rechaza si falta un campo', () => {
    expect(getMessages({ startAt: '2026-10-10T19:00:00Z' })).toEqual([
      MSG.invalidDate,
    ]);
  });

  it('rechaza campos extra como mentorId (sale de la sesión, no del body)', () => {
    expect(
      schema.safeParse({
        startAt: '2026-10-10T19:00:00Z',
        endAt: '2026-10-10T20:00:00Z',
        mentorId: 'abc',
      }).success,
    ).toBe(false);
  });

  it('usa la fecha actual por defecto', () => {
    const defaultSchema = buildCreateBlockSchema();
    expect(
      defaultSchema.safeParse({
        startAt: '2020-01-01T12:00:00Z',
        endAt: '2020-01-01T13:00:00Z',
      }).success,
    ).toBe(false);
  });
});
