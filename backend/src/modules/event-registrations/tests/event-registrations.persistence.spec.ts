import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

import { EventsService } from '../../events/services/events.service.js';

const eventFilter = {
  status: { title: 'Publicado' },
  OR: [
    {
      sessions: { some: { endsAt: { gt: new Date('2026-10-23T12:00:00Z') } } },
    },
    {
      sessions: { none: {} },
      OR: [
        { eventDate: { gt: new Date('2026-10-23T00:00:00Z') } },
        {
          eventDate: new Date('2026-10-23T00:00:00Z'),
          endTime: { gt: new Date('1970-01-01T08:00:00Z') },
        },
      ],
    },
  ],
};

describe('EventRegistrationsService', () => {
  const findMany = vi.fn();
  let repository: EventRegistrationsService;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-23T12:00:00Z'));
    findMany.mockReset();
    repository = new EventRegistrationsService(
      new EventRegistrationsRepository({
        eventRegistration: { findMany },
      } as unknown as PrismaService),
      new EventsService({} as never),
    );
  });

  afterEach(() => vi.useRealTimers());

  it('consulta por userId con el select y orden esperados', async () => {
    findMany.mockResolvedValue([]);

    await repository.findByUserId('user-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        cancelledAt: null,
        status: { title: 'Confirmada' },
        event: eventFilter,
      },
      select: {
        id: true,
        eventId: true,
        registeredAt: true,
        cancelledAt: true,
        status: { select: { title: true } },
        event: {
          select: {
            title: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            location: true,
            sessions: {
              select: {
                id: true,
                startsAt: true,
                endsAt: true,
                location: true,
              },
              orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
            },
          },
        },
      },
      orderBy: { event: { eventDate: 'asc' } },
    });
  });

  it('devuelve lo que entrega Prisma', async () => {
    const rows = [{ id: 'reg-1' }];
    findMany.mockResolvedValue(rows);

    await expect(repository.findByUserId('user-1')).resolves.toBe(rows);
  });

  it('solo lista inscripciones de eventos publicados', async () => {
    findMany.mockResolvedValue([]);

    await repository.findByUserId('user-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          event: eventFilter,
        }),
      }),
    );
  });
});
