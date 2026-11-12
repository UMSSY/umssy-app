import { describe, expect, it } from 'vitest';
import { CREATE_BLOCK_MESSAGES as MSG } from '../constants/create-block.constants.js';
import { updateBlockSchema } from '../requests/update-block.request.js';

describe('updateBlockSchema', () => {
  it('rechaza campos de repetición al editar un bloque individual', () => {
    expect(
      updateBlockSchema.safeParse({
        startAt: '2099-10-10T19:00:00Z',
        endAt: '2099-10-10T20:00:00Z',
        repeatWeekly: true,
        repeatUntil: '2099-10-31',
      }).success,
    ).toBe(false);
  });
  it('acepta un bloque futuro de 1 h 30', () => {
    const result = updateBlockSchema.safeParse({
      startAt: '2099-10-10T19:00:00Z',
      endAt: '2099-10-10T20:30:00Z',
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['1 h', '2099-10-10T20:00:00Z'],
    ['3 h', '2099-10-10T22:00:00Z'],
  ])('rechaza un bloque de %s: al editar debe durar 1 h 30', (_case, endAt) => {
    const result = updateBlockSchema.safeParse({
      startAt: '2099-10-10T19:00:00Z',
      endAt,
    });
    expect(
      result.success ? [] : result.error.issues.map((i) => i.message),
    ).toEqual([MSG.invalidBlockDuration]);
  });

  it('rechaza fin anterior o igual al inicio', () => {
    const result = updateBlockSchema.safeParse({
      startAt: '2099-10-10T20:00:00Z',
      endAt: '2099-10-10T19:00:00Z',
    });
    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((i) => i.message),
    ).toEqual([MSG.endBeforeStart]);
  });

  it('rechaza horas fuera de pasos de 30 minutos', () => {
    const result = updateBlockSchema.safeParse({
      startAt: '2099-10-10T19:10:00Z',
      endAt: '2099-10-10T20:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza mentorId en el body: sale de la sesión, no del payload', () => {
    const result = updateBlockSchema.safeParse({
      startAt: '2099-10-10T19:00:00Z',
      endAt: '2099-10-10T20:00:00Z',
      mentorId: 'abc',
    });
    expect(result.success).toBe(false);
  });
});
