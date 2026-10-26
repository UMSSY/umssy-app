import { describe, expect, it, vi } from 'vitest';
import { seedEventRegistrations } from '../seeds/event-registrations.seed.js';

describe('registration catalog seed', () => {
  it('idempotently ensures both titles without changing existing registrations', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'status' });
    const registrations = vi.fn();
    const tx = { registrationStatus: { upsert }, eventRegistration: { upsert: registrations, findMany: vi.fn().mockResolvedValue([]) } };
    await seedEventRegistrations(tx as never, 'user');
    for (const title of ['Confirmada', 'Cancelada']) {
      expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { title }, update: {}, create: expect.objectContaining({ title }) }));
    }
    for (const [args] of registrations.mock.calls) expect(args.update).toEqual({});
  });
});

  it('creates distinct valid QR tokens for the initial workshop registrations', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'status' });
    const registrations = vi.fn();
    await seedEventRegistrations({ registrationStatus: { upsert }, eventRegistration: { upsert: registrations, findMany: vi.fn().mockResolvedValue([]) } } as never, 'user');
    const tokens = registrations.mock.calls.map(([args]) => args.create.qrToken);
    expect(tokens).toHaveLength(2);
    for (const token of tokens) expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(new Set(tokens).size).toBe(tokens.length);
  });
