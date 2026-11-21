import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { EventsService } from '../../events/services/events.service.js';

const now = new Date('2026-10-23T15:00:00.000Z');
const finishedFilter = new EventsService({} as never).getFinishedEventFilter(
  now,
);

describe('EventRegistrationsRepository finished history', () => {
  const findMany = vi.fn();
  const count = vi.fn();
  const transaction = vi.fn();
  let repository: EventRegistrationsRepository;

  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
    count.mockReset().mockResolvedValue(0);
    transaction
      .mockReset()
      .mockImplementation((queries) => Promise.all(queries));
    repository = new EventRegistrationsRepository({
      eventRegistration: { findMany, count },
      $transaction: transaction,
    } as never);
  });

  it('filters both queries by the authenticated user and active registrations', async () => {
    await repository.findFinishedByUserId('user-a', finishedFilter, 0, 10);

    const findWhere = findMany.mock.calls[0][0].where;
    const countWhere = count.mock.calls[0][0].where;
    expect(findWhere).toBe(countWhere);
    expect(findWhere).toMatchObject({
      userId: 'user-a',
      cancelledAt: null,
      status: { title: 'Confirmada' },
      event: {
        status: { title: { in: ['Publicado', 'Finalizado'] } },
      },
    });
    expect(transaction).toHaveBeenCalledOnce();
  });

  it('uses the finished criterion from EventsService: last session or inclusive legacy end', async () => {
    await repository.findFinishedByUserId('user-a', finishedFilter, 0, 10);

    expect(findMany.mock.calls[0][0].where.event.OR).toEqual([
      { sessions: { some: {}, none: { endsAt: { gt: now } } } },
      {
        sessions: { none: {} },
        OR: [
          { eventDate: { lt: new Date('2026-10-23T00:00:00.000Z') } },
          {
            eventDate: new Date('2026-10-23T00:00:00.000Z'),
            endTime: { lte: new Date('1970-01-01T11:00:00.000Z') },
          },
        ],
      },
    ]);
  });

  it('orders deterministically and paginates the same transaction', async () => {
    findMany.mockResolvedValue([{ id: 'reg-a' }]);
    count.mockResolvedValue(3);

    const result = await repository.findFinishedByUserId(
      'user-a',
      finishedFilter,
      2,
      2,
    );

    expect(findMany.mock.calls[0][0]).toMatchObject({
      skip: 2,
      take: 2,
      orderBy: [
        { event: { eventDate: 'desc' } },
        { event: { endTime: 'desc' } },
        { id: 'desc' },
      ],
    });
    expect(result).toEqual({ items: [{ id: 'reg-a' }], total: 3 });
  });
});
