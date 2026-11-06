import { describe, expect, it } from 'vitest';
import { BLOCKED_DATE_MESSAGES as MSG } from '../constants/blocked-date.constants.js';
import { blockDateSchema } from '../requests/block-date.request.js';

const messagesOf = (input: unknown): string[] => {
  const result = blockDateSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('blockDateSchema', () => {
  it('acepta una fecha con motivo y recorta los espacios del motivo', () => {
    expect(blockDateSchema.parse({ blockedOn: '2026-10-27', reason: '  Congreso  ' })).toEqual({
      blockedOn: '2026-10-27',
      reason: 'Congreso',
    });
  });

  it.each([
    ['sin motivo', {}],
    ['motivo null', { reason: null }],
    ['motivo vacío', { reason: '' }],
    ['motivo solo con espacios', { reason: '   ' }],
  ])('guarda el motivo como null si viene %s', (_case, extra) => {
    expect(blockDateSchema.parse({ blockedOn: '2026-10-27', ...extra }).reason).toBeNull();
  });

  it('acepta un motivo de exactamente 100 caracteres', () => {
    expect(messagesOf({ blockedOn: '2026-10-27', reason: 'a'.repeat(100) })).toEqual([]);
  });

  it('rechaza un motivo de más de 100 caracteres', () => {
    expect(messagesOf({ blockedOn: '2026-10-27', reason: 'a'.repeat(101) })).toEqual([MSG.reasonTooLong]);
  });

  it('rechaza un motivo que no es texto', () => {
    expect(messagesOf({ blockedOn: '2026-10-27', reason: 5 })).toEqual([MSG.invalidReason]);
  });

  it.each(['27/10/2026', '2026-10-27T00:00:00Z', '2026-02-30', '2026-13-01', ''])(
    'rechaza la fecha %s',
    (blockedOn) => {
      expect(messagesOf({ blockedOn })).toEqual([MSG.invalidDate]);
    },
  );

  it('rechaza si falta la fecha', () => {
    expect(messagesOf({ reason: 'Congreso' })).toEqual([MSG.invalidDate]);
  });

  it('rechaza campos extra como mentorId (sale de la sesión)', () => {
    expect(blockDateSchema.safeParse({ blockedOn: '2026-10-27', mentorId: 'otro' }).success).toBe(false);
  });
});
