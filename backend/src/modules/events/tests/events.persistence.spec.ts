import { EventsRepository } from '../repositories/events.repository.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventsService } from '../services/events.service.js';

describe('EventsService', () => {
  let repository: EventsService;
  let prismaMock: {
    event: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prismaMock = {
      event: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi
        .fn()
        .mockImplementation((promises) => Promise.all(promises)),
    };
    repository = new EventsService(new EventsRepository(prismaMock as never));
  });

  it('keeps voting proposals and cover metadata available after registration integration', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);
    await repository.findAndCount({
      includeProposals: true,
      skip: 0,
      take: 10,
    });
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: {
            title: { in: ['Publicado', 'Votacion', 'En votación'] },
          },
        },
        select: expect.objectContaining({
          coverMimeType: true,
          votingDeadline: true,
          supportThreshold: true,
        }),
      }),
    );
  });

  it('defaults to published workshops when no status filter is provided', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    const result = await repository.findAndCount({ skip: 10, take: 5 });

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: { title: 'Publicado' } }, skip: 10, take: 5 }),
    );
    expect(prismaMock.event.count).toHaveBeenCalledWith({ where: { status: { title: 'Publicado' } } });
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('includes proposal statuses only when explicitly requested', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({
      includeProposals: true,
      skip: 0,
      take: 10,
    });

    const expectedWhere = {
      status: {
        title: { in: ['Publicado', 'Votacion', 'En votación'] },
      },
    };

    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(prismaMock.event.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('keeps the public catalogue published-only and selects proposal covers', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);
    await repository.findAndCount({ skip: 0, take: 10 });
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { title: 'Publicado' } },
        select: expect.objectContaining({ coverMimeType: true }),
      }),
    );
  });

  it('applies only search filter with case-insensitive partial match to where', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({ search: 'Tech', skip: 0, take: 10 });

    const expectedWhere = {
      status: { title: 'Publicado' },
      title: {
        contains: 'Tech',
        mode: 'insensitive',
      },
    };

    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(prismaMock.event.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('escapes wildcards percent (%) and underscore (_) in search', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({ search: '100%_test', skip: 0, take: 10 });

    const expectedWhere = {
      status: { title: 'Publicado' },
      title: {
        contains: '100\\%\\_test',
        mode: 'insensitive',
      },
    };

    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
  });

  it('applies categoryId filter to where in both queries', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({ categoryId: 'cat-abc', skip: 0, take: 10 });

    const expectedWhere = { categoryId: 'cat-abc', status: { title: 'Publicado' } };
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(prismaMock.event.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('applies statusId filter to where in both queries', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({
      statusId: 'status-abc',
      includeProposals: true,
      skip: 0,
      take: 10,
    });

    const expectedWhere = { statusId: 'status-abc' };
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(prismaMock.event.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('combines search and categoryId with AND in where clause', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({
      search: 'workshop',
      categoryId: 'cat-123',
      skip: 0,
      take: 10,
    });

    const expectedWhere = {
      categoryId: 'cat-123',
      status: { title: 'Publicado' },
      title: {
        contains: 'workshop',
        mode: 'insensitive',
      },
    };

    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(prismaMock.event.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('combines search, categoryId, and statusId in where clause', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({
      search: 'workshop',
      categoryId: 'cat-123',
      statusId: 'status-456',
      skip: 0,
      take: 10,
    });

    const expectedWhere = {
      categoryId: 'cat-123',
      statusId: 'status-456',
      title: {
        contains: 'workshop',
        mode: 'insensitive',
      },
    };

    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(prismaMock.event.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('orders by eventDate asc and startTime asc', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({ skip: 0, take: 10 });

    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }, { id: 'asc' }],
      }),
    );
  });
  it('counts only confirmed registrations that have not been cancelled', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);
    await repository.findAndCount({ skip: 0, take: 10 });
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: {
            select: {
              registrations: {
                where: { cancelledAt: null, status: { title: 'Confirmada' } },
              },
            },
          },
        }),
      }),
    );
  });

  it('selects only the authenticated user registration when userId is provided', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({ userId: 'user-1', skip: 0, take: 10 });

    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          registrations: {
            where: {
              userId: 'user-1',
              cancelledAt: null,
              status: { title: 'Confirmada' },
            },
            select: { id: true },
            take: 1,
          },
        }),
      }),
    );
  });

  it('does not return user registrations when there is no userId', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);

    await repository.findAndCount({ skip: 0, take: 10 });

    const args = prismaMock.event.findMany.mock.calls[0][0];
    expect(args.select.registrations.where.userId).toEqual({ in: [] });
  });

  it('applies the catalog visibility instead of the plain status filter', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);
    const visibility = { status: { title: 'Publicado' }, OR: [{ sessions: { some: {} } }] };
    await repository.findAndCount({
      categoryId: 'cat-abc',
      statusId: 'ignored-status',
      includeProposals: true,
      visibility,
      skip: 0,
      take: 10,
    });
    const expectedWhere = { categoryId: 'cat-abc', ...visibility };
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(prismaMock.event.count).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it('orders finished workshops from the most recent', async () => {
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.event.count.mockResolvedValue(0);
    await repository.findAndCount({ newestFirst: true, skip: 0, take: 10 });
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ eventDate: 'desc' }, { startTime: 'desc' }, { id: 'asc' }],
      }),
    );
  });
});
