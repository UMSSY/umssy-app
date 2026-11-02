import { describe, expect, it, vi } from 'vitest';
import { FixtureContext } from '../../../common/database/fixture-context.js';
import { seedEventRegistrationsFixtures } from '../seeds/event-registrations-fixtures.seed.js';

describe('registration fixture QR tokens', () => {
  it('creates unique valid tokens while preserving duplicate registrations', async () => {
    const context = new FixtureContext(new Date('2026-10-25T12:00:00Z'), 'admin');
    context.setReference('registration_statuses', 'Confirmada', 'confirmed');
    context.setReference('registration_statuses', 'Cancelada', 'cancelled');
    const createMany = vi.fn().mockResolvedValue({ count: 0 });
    const count = await seedEventRegistrationsFixtures({ eventRegistration: { createMany, findMany: vi.fn().mockResolvedValue([]) } } as never, context);
    const { data, skipDuplicates } = createMany.mock.calls[0]![0];
    expect(skipDuplicates).toBe(true);
    expect(count).toBe(data.length);
    expect(count).toBeGreaterThan(0);
    const tokens = data.map((row: { qrToken: string }) => row.qrToken);
    for (const token of tokens) expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(new Set(tokens).size).toBe(count);
  });
});
