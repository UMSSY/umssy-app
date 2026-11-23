import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventCategoriesService } from '@/modules/event-categories/services/event-categories.service';
import { eventsService } from './events.service';
import { prepareOfflineEvents } from './prepare-offline-events';

vi.mock('./events.service', () => ({
  eventsService: { getEvents: vi.fn(), getEvent: vi.fn() },
}));
vi.mock('@/modules/event-categories/services/event-categories.service', () => ({
  eventCategoriesService: { getAll: vi.fn() },
}));

describe('prepareOfflineEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventCategoriesService.getAll).mockResolvedValue([]);
    vi.mocked(eventsService.getEvent).mockResolvedValue({} as never);
  });

  it('stores the catalog in the default recommended order with each detail', async () => {
    vi.mocked(eventsService.getEvents).mockResolvedValue({
      data: [{ id: 'event-1' }, { id: 'event-2' }] as never,
      page: 1,
      offset: 0,
    });
    const controller = new AbortController();

    await prepareOfflineEvents('token', controller.signal);

    expect(eventCategoriesService.getAll).toHaveBeenCalledWith(
      controller.signal,
      'token',
      true,
    );
    expect(eventsService.getEvents).toHaveBeenCalledWith(
      { page: 1, limit: 50, includeProposals: true, sort: 'recommended' },
      controller.signal,
      'token',
      true,
    );
    expect(eventsService.getEvent).toHaveBeenCalledTimes(2);
  });

  it('keeps reading pages while they are full', async () => {
    const fullPage = Array.from({ length: 50 }, (_, index) => ({
      id: `event-${index}`,
    }));
    vi.mocked(eventsService.getEvents)
      .mockResolvedValueOnce({ data: fullPage as never, page: 1, offset: 0 })
      .mockResolvedValueOnce({ data: [] as never, page: 2, offset: 50 });

    await prepareOfflineEvents('token', new AbortController().signal);

    expect(eventsService.getEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
      expect.any(AbortSignal),
      'token',
      true,
    );
  });

  it('stops when the preparation is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      prepareOfflineEvents('token', controller.signal),
    ).rejects.toThrow();
    expect(eventsService.getEvents).not.toHaveBeenCalled();
  });
});
