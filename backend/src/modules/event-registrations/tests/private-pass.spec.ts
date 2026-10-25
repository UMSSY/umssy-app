import { describe, expect, it, vi } from 'vitest';
import { EventRegistrationsService } from '../services/event-registrations.service.js';

function setup() {
  const findFirst = vi.fn();
  const service = new EventRegistrationsService({ eventRegistration: { findFirst } } as never, {} as never);
  return { service, findFirst };
}

describe('Private pass consultation', () => {
  it('filters by authenticated owner, active registration and published event', async () => {
    const { service, findFirst } = setup();
    const pass = { id: 'pass-1', qrToken: 'a'.repeat(64) };
    findFirst.mockResolvedValue(pass);
    await expect(service.getPassById('pass-1', 'owner')).resolves.toBe(pass);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'pass-1', userId: 'owner', cancelledAt: null,
        status: { title: 'Confirmada' }, event: { status: { title: 'Publicado' } },
      },
      select: expect.objectContaining({ qrToken: true, event: expect.any(Object), user: expect.any(Object) }),
    });
  });

  it.each([null, { qrToken: null }, { qrToken: '' }])('rejects an unavailable pass or missing QR: %j', async (pass) => {
    const { service, findFirst } = setup();
    findFirst.mockResolvedValue(pass);
    await expect(service.getPassById('pass-1', 'owner')).rejects.toMatchObject({ statusCode: 404, code: 'PASS_NOT_FOUND' });
  });

  it('propagates persistence failures instead of pretending the pass does not exist', async () => {
    const { service, findFirst } = setup();
    const failure = new Error('database unavailable');
    findFirst.mockRejectedValue(failure);
    await expect(service.getPassById('pass-1', 'owner')).rejects.toBe(failure);
  });
});
