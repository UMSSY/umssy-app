import { EventsRepository } from '../repositories/events.repository.js';
import { describe, expect, it, vi } from 'vitest';
import { EventsService } from '../services/events.service.js';

describe('event registration lookup', () => {
  it('uses the caller transaction and only selects event data', async () => {
    const prisma = { event: { findUnique: vi.fn() } };
    const event = { id: 'event' };
    const tx = { event: { findUnique: vi.fn().mockResolvedValue(event) } };
    const service = new EventsService(new EventsRepository(prisma as never));
    await expect(service.findForRegistration('event', tx as never)).resolves.toBe(event);
    expect(tx.event.findUnique).toHaveBeenCalledWith({ where: { id: 'event' }, select: { id: true, capacity: true, eventDate: true, startTime: true, endTime: true, status: { select: { title: true } } } });
    expect(prisma.event.findUnique).not.toHaveBeenCalled();
  });

  it('returns the domain error when the event is absent', async () => {
    const service = new EventsService(new EventsRepository({ event: { findUnique: vi.fn().mockResolvedValue(null) } } as never));
    await expect(service.findForRegistration('missing')).rejects.toMatchObject({ statusCode: 404, code: 'EVENT_NOT_FOUND' });
  });
});
