import { EventsRepository } from '../repositories/events.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventNotFoundException } from '../exceptions/event-not-found.exception.js';
import { EventsService } from '../services/events.service.js';

describe('EventsService - vencimiento automático', () => {
  const expireOverdueProposals = vi.fn();
  const findAndCount = vi.fn();
  const findById = vi.fn();
  let service: EventsService;

  beforeEach(() => {
    expireOverdueProposals.mockReset();
    findAndCount.mockReset();
    findById.mockReset();
    expireOverdueProposals.mockResolvedValue(0);
    findAndCount.mockResolvedValue({ items: [], total: 0 });
    findById.mockResolvedValue(null);
    service = new EventsService(new EventsRepository({} as never));
    vi.spyOn(service, 'expireOverdueProposals').mockImplementation(
      expireOverdueProposals,
    );
    vi.spyOn(service, 'findAndCount').mockImplementation(findAndCount);
    vi.spyOn(service, 'findById').mockImplementation(findById);
  });

  it('lists without changing proposal status', async () => {
    await service.findAll({ page: 1, limit: 10 });

    expect(expireOverdueProposals).not.toHaveBeenCalled();
    expect(findAndCount).toHaveBeenCalledOnce();
  });

  it('reads a proposal without changing its status', async () => {
    await expect(service.findOne('event-1')).rejects.toBeInstanceOf(
      EventNotFoundException,
    );

    expect(expireOverdueProposals).not.toHaveBeenCalled();
    expect(findById).toHaveBeenCalledOnce();
  });

  it('keeps a read side-effect free at the expiry instant', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T23:59:00.000Z'));
    try {
      await service.findAll({ page: 1, limit: 10 });

      expect(expireOverdueProposals).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
