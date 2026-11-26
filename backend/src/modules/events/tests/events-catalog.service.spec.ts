import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsCatalogService } from '../services/events-catalog.service.js';
import type { EventsService } from '../services/events.service.js';
import type { EventAffinitySignalsService } from '../services/event-affinity-signals.service.js';
import type { AffinitySignals } from '../types/affinity-signals.types.js';
import type { EventWithRelations } from '../types/events.types.js';

function buildRecord(
  id: string,
  registrations: number,
  title = `Taller ${id}`,
): EventWithRelations {
  return {
    id,
    title,
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
    coverMimeType: null,
    registrations: [],
    sessions: [],
    _count: { registrations },
  };
}

const ACTIVE_VISIBILITY = { status: { title: 'Publicado' } };

describe('EventsCatalogService', () => {
  let eventsService: {
    findAll: ReturnType<typeof vi.fn>;
    findAndCount: ReturnType<typeof vi.fn>;
    expireOverdueProposals: ReturnType<typeof vi.fn>;
    getCatalogVisibilityFilter: ReturnType<typeof vi.fn>;
  };
  let signals: { findByUserId: ReturnType<typeof vi.fn> };
  let service: EventsCatalogService;

  beforeEach(() => {
    eventsService = {
      findAll: vi.fn().mockResolvedValue({ data: { items: [] } }),
      findAndCount: vi.fn(),
      expireOverdueProposals: vi.fn().mockResolvedValue(0),
      getCatalogVisibilityFilter: vi.fn().mockReturnValue(ACTIVE_VISIBILITY),
    };
    signals = { findByUserId: vi.fn() };
    service = new EventsCatalogService(
      eventsService as unknown as EventsService,
      signals as unknown as EventAffinitySignalsService,
    );
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

    expect(eventsService.expireOverdueProposals).not.toHaveBeenCalled();
    expect(eventsService.findAndCount).toHaveBeenCalledWith({
      categoryId: 'cat-1',
      statusId: undefined,
      includeProposals: true,
      search: 'taller',
      userId: 'user-1',
      visibility: ACTIVE_VISIBILITY,
    });
    expect(eventsService.getCatalogVisibilityFilter).toHaveBeenCalledWith(
      expect.objectContaining({ includeProposals: true }),
    );
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
      expect.objectContaining({
        statusId: '6f9619ff-8b86-4011-b42d-00c04fc964ff',
      }),
    );
    expect(result.data.items.map(({ id }) => id)).toEqual(['a']);
    expect(result.offset).toBe(2);
  });

  describe('recommended sort', () => {
    const emptySignals: AffinitySignals = {
      skills: [],
      radarScores: {},
      careers: [],
      interests: '',
    };

    it('keeps the date order when there is no authenticated user', async () => {
      await service.findAll({ page: 1, limit: 10, sort: 'recommended' });

      expect(eventsService.findAll).toHaveBeenCalled();
      expect(signals.findByUserId).not.toHaveBeenCalled();
    });

    it('falls back to popularity and flags an incomplete profile without signals', async () => {
      signals.findByUserId.mockResolvedValue(emptySignals);
      eventsService.findAndCount.mockResolvedValue({
        items: [buildRecord('a', 1), buildRecord('b', 4)],
        total: 2,
      });

      const result = await service.findAll(
        { page: 1, limit: 10, sort: 'recommended' },
        'user-1',
      );

      expect(signals.findByUserId).toHaveBeenCalledWith('user-1');
      expect(result.data.isProfileComplete).toBe(false);
      expect(result.data.items.map(({ id }) => id)).toEqual(['b', 'a']);
      expect(result.data.items[0].recommendation).toBeUndefined();
    });

    it('places affine workshops first and attaches the recommendation of each page item', async () => {
      signals.findByUserId.mockResolvedValue({
        ...emptySignals,
        skills: ['React'],
      });
      eventsService.findAndCount.mockResolvedValue({
        items: [
          buildRecord('popular', 20, 'Oratoria para entrevistas'),
          buildRecord('react', 1, 'Componentes con React'),
          buildRecord('other', 3, 'Finanzas personales'),
        ],
        total: 3,
      });

      const firstPage = await service.findAll(
        { page: 1, limit: 2, sort: 'recommended' },
        'user-1',
      );
      const secondPage = await service.findAll(
        { page: 2, limit: 2, sort: 'recommended' },
        'user-1',
      );

      expect(firstPage.data.isProfileComplete).toBe(true);
      expect(firstPage.data.items.map(({ id }) => id)).toEqual([
        'react',
        'popular',
      ]);
      expect(firstPage.data.items[0].recommendation?.reasons).toEqual([
        'React',
      ]);
      expect(firstPage.data.items[1].recommendation?.reasons).toEqual([]);
      expect(secondPage.data.items.map(({ id }) => id)).toEqual(['other']);
      expect(secondPage.data.total).toBe(3);
    });
  });

  it('lists finished workshops by date even when a ranking is requested', async () => {
    for (const sort of ['popular', 'recommended'] as const) {
      eventsService.findAll.mockClear();
      await service.findAll(
        { page: 1, limit: 10, sort, scope: 'finished' },
        'user-1',
      );
      expect(eventsService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10, sort, scope: 'finished' },
        'user-1',
      );
    }
    expect(eventsService.findAndCount).not.toHaveBeenCalled();
    expect(signals.findByUserId).not.toHaveBeenCalled();
  });

  it('ranks the exact status when statusId and finished scope are both present', async () => {
    eventsService.findAndCount.mockResolvedValue({
      items: [buildRecord('older', 1), buildRecord('popular', 8)],
      total: 2,
    });
    const result = await service.findAll({
      page: 1,
      limit: 10,
      statusId: 'status-1',
      scope: 'finished',
      sort: 'popular',
    });

    expect(result.data.items.map(({ id }) => id)).toEqual(['popular', 'older']);
    expect(eventsService.findAll).not.toHaveBeenCalled();
    expect(eventsService.getCatalogVisibilityFilter).toHaveBeenCalledWith(
      expect.objectContaining({ statusId: 'status-1', scope: 'finished' }),
    );
  });
});
