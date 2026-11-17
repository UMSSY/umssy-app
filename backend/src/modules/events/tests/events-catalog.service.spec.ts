import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsCatalogService } from '../services/events-catalog.service.js';
import type { EventsService } from '../services/events.service.js';
import type { EventWithRelations } from '../types/events.types.js';

function buildRecord(id: string, registrations: number): EventWithRelations {
  return {
    id,
    title: `Taller ${id}`,
    description: null,
    eventDate: new Date('2026-12-15T00:00:00.000Z'),
    startTime: new Date('1970-01-01T10:00:00.000Z'),
    endTime: new Date('1970-01-01T12:00:00.000Z'),
    location: null,
    capacity: 30,
    statusId: 'status-1',
    instructorName: null,
    modalityId: 'modality-1',
    supportThreshold: null,
    votingDeadline: null,
    status: { title: 'Publicado' },
    origin: { title: 'Institucional' },
    category: { id: 'cat-1', name: 'Tecnología' },
    _count: { registrations },
  };
}

describe('EventsCatalogService', () => {
  let eventsService: {
    findAll: ReturnType<typeof vi.fn>;
    findAndCount: ReturnType<typeof vi.fn>;
    expireOverdueProposals: ReturnType<typeof vi.fn>;
  };
  let service: EventsCatalogService;

  beforeEach(() => {
    eventsService = {
      findAll: vi.fn().mockResolvedValue({ data: { items: [] } }),
      findAndCount: vi.fn(),
      expireOverdueProposals: vi.fn().mockResolvedValue(0),
    };
    service = new EventsCatalogService(eventsService as unknown as EventsService);
  });

  it('keeps the date order when no sort is requested', async () => {
    await service.findAll({ page: 1, limit: 10 }, 'user-1');

    expect(eventsService.findAll).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      'user-1',
    );
    expect(eventsService.findAndCount).not.toHaveBeenCalled();
  });

  it('orders the whole filtered catalog by confirmed registrations before paginating', async () => {
    eventsService.findAndCount.mockResolvedValue({
      items: [
        buildRecord('a', 2),
        buildRecord('b', 9),
        buildRecord('c', 5),
        buildRecord('d', 9),
      ],
      total: 4,
    });

    const result = await service.findAll(
      {
        page: 1,
        limit: 3,
        sort: 'popular',
        categoryId: 'cat-1',
        search: 'taller',
        includeProposals: true,
      },
      'user-1',
    );

    expect(eventsService.expireOverdueProposals).toHaveBeenCalled();
    expect(eventsService.findAndCount).toHaveBeenCalledWith({
      categoryId: 'cat-1',
      statusId: undefined,
      isPublishedOnly: true,
      includeProposals: true,
      search: 'taller',
      userId: 'user-1',
    });
    expect(result.data.items.map(({ id }) => id)).toEqual(['b', 'd', 'c']);
    expect(result.data.total).toBe(4);
    expect(result.data.totalPages).toBe(2);
  });

  it('returns the requested page of the popular ranking', async () => {
    eventsService.findAndCount.mockResolvedValue({
      items: [buildRecord('a', 1), buildRecord('b', 3), buildRecord('c', 2)],
      total: 3,
    });

    const result = await service.findAll({
      page: 2,
      limit: 2,
      sort: 'popular',
      statusId: '6f9619ff-8b86-4011-b42d-00c04fc964ff',
    });

    expect(eventsService.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ isPublishedOnly: false }),
    );
    expect(result.data.items.map(({ id }) => id)).toEqual(['a']);
    expect(result.offset).toBe(2);
  });
});
