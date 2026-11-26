import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { EventsRepository } from '../repositories/events.repository.js';
import { EventsService } from '../services/events.service.js';

const event = {
  id: 'target-event',
  eventDate: new Date('2026-12-01T00:00:00Z'),
  startTime: new Date('1970-01-01T09:00:00Z'),
  endTime: new Date('1970-01-01T12:00:00Z'),
};

describe('schedule conflict lookup through the events domain', () => {
  it.each([null, { id: 'other-event' }])(
    'keeps the lookup inside the supplied transaction: %j',
    async (record) => {
      const outsideTransaction = vi.fn();
      const findFirst = vi.fn().mockResolvedValue(record);
      const tx = {
        event: { findFirst },
      } as unknown as Prisma.TransactionClient;
      const service = new EventsService(
        new EventsRepository({
          event: { findFirst: outsideTransaction },
        } as never),
      );

      expect(
        await service.hasScheduleConflict(tx, event, ['other-event']),
      ).toBe(Boolean(record));
      expect(findFirst).toHaveBeenCalledOnce();
      expect(outsideTransaction).not.toHaveBeenCalled();
    },
  );

  it('does not query events when the user has no confirmed registrations', async () => {
    const findFirst = vi.fn();
    const tx = { event: { findFirst } } as unknown as Prisma.TransactionClient;
    const service = new EventsService(new EventsRepository({} as never));
    expect(await service.hasScheduleConflict(tx, event, [])).toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
  });
});
