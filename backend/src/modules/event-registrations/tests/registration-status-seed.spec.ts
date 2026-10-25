import { describe, expect, it, vi } from 'vitest';
import { seedEventRegistrations } from '../seeds/event-registrations.seed.js';

describe('registration catalog seed', () => {
  it('idempotently ensures both titles without changing existing registrations', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'status' });
    const registrations = vi.fn();
    const tx = { registrationStatus: { upsert }, eventRegistration: { upsert: registrations } };
    await seedEventRegistrations(tx as never, 'user');
    for (const title of ['Confirmada', 'Cancelada']) {
      expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { title }, update: {}, create: expect.objectContaining({ title }) }));
    }
    for (const [args] of registrations.mock.calls) expect(args.update).toEqual({});
  });
});
