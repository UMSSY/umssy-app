import { describe, expect, it, vi } from 'vitest';
import { repairSeededQrTokens } from '../seeds/repair-seeded-qr-tokens.js';

describe('repair seeded QR tokens', () => {
  it('repairs legacy tokens once and preserves valid tokens', async () => {
    const rows = [{ id: 'nest', qrToken: 'qr-seed-3331' }, { id: 'prisma', qrToken: 'qr-seed-3332' }, { id: 'fixture', qrToken: 'seed-fixture' }, { id: 'valid', qrToken: 'a'.repeat(64) }];
    const findMany = vi.fn().mockImplementation(async ({ where }) => rows.filter((row) => where.OR.some((condition: { qrToken: { startsWith: string } }) => row.qrToken.startsWith(condition.qrToken.startsWith))).map((row) => ({ ...row })));
    const updateMany = vi.fn().mockImplementation(async ({ where, data }) => {
      const row = rows.find((entry) => entry.id === where.id && entry.qrToken === where.qrToken);
      if (!row) return { count: 0 };
      row.qrToken = data.qrToken;
      return { count: 1 };
    });
    const tx = { eventRegistration: { findMany, updateMany } };
    expect(await repairSeededQrTokens(tx as never)).toBe(3);
    for (const row of rows) expect(row.qrToken).toMatch(/^[a-f0-9]{64}$/);
    expect(new Set(rows.map((row) => row.qrToken)).size).toBe(4);
    expect(rows[3]!.qrToken).toBe('a'.repeat(64));
    const tokens = rows.map((row) => row.qrToken);
    expect(await repairSeededQrTokens(tx as never)).toBe(0);
    expect(rows.map((row) => row.qrToken)).toEqual(tokens);
    for (const [args] of updateMany.mock.calls) expect(Object.keys(args.data)).toEqual(['qrToken']);
  });

  it('does not overwrite a token changed concurrently', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'registration', qrToken: 'qr-seed-old' }]);
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    expect(await repairSeededQrTokens({ eventRegistration: { findMany, updateMany } } as never)).toBe(0);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: 'registration', qrToken: 'qr-seed-old' }, data: { qrToken: expect.stringMatching(/^[a-f0-9]{64}$/) } });
  });
});
