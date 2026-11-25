import { EventsRepository } from '../repositories/events.repository.js';
import { EventNotFoundException } from '../exceptions/event-not-found.exception.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventsService } from '../services/events.service.js';
import type { EventWithRelations } from '../types/events.types.js';

function buildRecord(): EventWithRelations {
  return {
    id: 'uuid-1',
    title: 'Evento',
    description: null,
    eventDate: new Date('2026-06-15T00:00:00.000Z'),
    startTime: new Date('1970-01-01T10:00:00.000Z'),
    endTime: new Date('1970-01-01T12:00:00.000Z'),
    location: null,
    capacity: 10,
    statusId: 'status-1',
    instructorName: null,
    modalityId: 'modality-1',
    supportThreshold: null,
    votingDeadline: null,
    status: { title: 'Publicado' },
    origin: { title: 'Institucional' },
    category: { id: 'cat-1', name: 'Tecnologia' },
    coverMimeType: null,
    registrations: [],
    sessions: [],
    _count: { registrations: 3 },
  };
}

describe('EventsService', () => {
  let service: EventsService;
  let repositoryMock: {
    findAndCount: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repositoryMock = { findAndCount: vi.fn(), findById: vi.fn() };
    service = new EventsService(new EventsRepository({} as never));
    vi.spyOn(service, 'findAndCount').mockImplementation(
      repositoryMock.findAndCount as (
        payload: Parameters<EventsService['findAndCount']>[0],
      ) => ReturnType<EventsService['findAndCount']>,
    );
    vi.spyOn(service, 'findById').mockImplementation(
      repositoryMock.findById as (
        id: string,
        userId?: string,
      ) => ReturnType<EventsService['findById']>,
    );
    vi.spyOn(service, 'expireOverdueProposals').mockResolvedValue(0);
  });

  it('returns formatted list with offset, totalPages and items', async () => {
    repositoryMock.findAndCount.mockResolvedValue({
      items: [buildRecord()],
      total: 1,
    });

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.data.items).toHaveLength(1);
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
    expect(result.data.total).toBe(1);
    expect(result.data.totalPages).toBe(1);
    expect(result.data.items[0].availableSpots).toBe(7);
    expect(result.data.items[0].registrationCount).toBe(3);
  });

  it('calculates totalPages as 0 when total is 0', async () => {
    repositoryMock.findAndCount.mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.data.items).toHaveLength(0);
    expect(result.data.total).toBe(0);
    expect(result.data.totalPages).toBe(0);
  });

  it('passes search, categoryId, statusId, skip and take to repository', async () => {
    repositoryMock.findAndCount.mockResolvedValue({ items: [], total: 0 });

    await service.findAll({
      page: 3,
      limit: 5,
      categoryId: 'cat-uuid',
      statusId: 'status-uuid',
      search: 'workshop',
    });

    expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
      categoryId: 'cat-uuid',
      statusId: 'status-uuid',
      search: 'workshop',
      userId: undefined,
      skip: 10,
      take: 5,
      visibility: { statusId: 'status-uuid' },
    });
  });

  it('calculates correct offset and totalPages when search and categoryId are provided', async () => {
    repositoryMock.findAndCount.mockResolvedValue({
      items: [buildRecord()],
      total: 25,
    });

    const result = await service.findAll({
      page: 2,
      limit: 10,
      search: 'Node',
      categoryId: 'cat-uuid',
    });

    expect(result.page).toBe(2);
    expect(result.offset).toBe(10);
    expect(result.data.total).toBe(25);
    expect(result.data.totalPages).toBe(3);
    expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
      categoryId: 'cat-uuid',
      statusId: undefined,
      search: 'Node',
      userId: undefined,
      skip: 10,
      take: 10,
      visibility: expect.objectContaining({ status: { title: 'Publicado' } }),
    });
  });
  it.each([10, 3, 0, null])(
    'normalizes detail and capacity %s',
    async (capacity) => {
      repositoryMock.findById.mockResolvedValue({
        ...buildRecord(),
        capacity,
        modality: { id: 'modality-1', title: 'Presencial' },
      });
      const detail = await service.findOne('uuid-1');
      expect(detail.eventDate).toBe('2026-06-15');
      expect(detail.startTime).toBe('10:00');
      expect(detail.registrationCount).toBe(3);
      expect(detail.availableSpots).toBe(
        capacity === null ? null : Math.max(0, capacity - 3),
      );
      expect(detail.modality.title).toBe('Presencial');
      expect(detail).not.toHaveProperty('_count');
    },
  );

  it('returns 404 for a missing workshop', async () => {
    repositoryMock.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      EventNotFoundException,
    );
  });

  it('passes the authenticated userId to the repository on list', async () => {
    repositoryMock.findAndCount.mockResolvedValue({ items: [], total: 0 });

    await service.findAll({ page: 1, limit: 10 }, 'user-1');

    expect(repositoryMock.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
  });

  describe('catalog visibility', () => {
    const now = new Date('2026-11-27T14:00:00.000Z');

    it('shows only published workshops that have not finished yet', () => {
      expect(service.getCatalogVisibilityFilter({}, now)).toEqual(
        service.getActiveRegistrationEventFilter(now),
      );
    });

    it('adds proposals in voting when they are requested', () => {
      expect(
        service.getCatalogVisibilityFilter({ includeProposals: true }, now),
      ).toEqual({
        OR: [
          service.getActiveRegistrationEventFilter(now),
          { status: { title: { in: ['Votacion', 'En votación'] } } },
        ],
      });
    });

    it('keeps the exact status filter, used for expired proposals', () => {
      expect(
        service.getCatalogVisibilityFilter(
          { statusId: 'status-uuid', includeProposals: true },
          now,
        ),
      ).toEqual({ statusId: 'status-uuid' });
    });

    it('treats a multi-session workshop as active until its last session ends', () => {
      const filter = service.getCatalogVisibilityFilter({}, now);
      expect(filter.OR).toContainEqual({
        sessions: { some: { endsAt: { gt: now } } },
      });
    });
  });
});
