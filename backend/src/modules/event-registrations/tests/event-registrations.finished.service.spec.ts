import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsService } from '../services/event-registrations.service.js';

const threshold = {
  eventDate: new Date('2026-10-23T00:00:00.000Z'),
  endTime: new Date('1970-01-01T11:00:00.000Z'),
};
const registration = {
  id: 'reg-a',
  eventId: 'event-a',
  registeredAt: new Date('2026-10-20T12:00:00.000Z'),
  cancelledAt: null,
  status: { title: 'Confirmada' },
  event: {
    title: 'Workshop A',
    eventDate: new Date('2026-10-23T00:00:00.000Z'),
    startTime: new Date('1970-01-01T09:00:00.000Z'),
    endTime: new Date('1970-01-01T11:00:00.000Z'),
    location: null,
  },
};

describe('EventRegistrationsService finished history', () => {
  const findByUserId = vi.fn();
  const findFinishedByUserId = vi.fn();
  const getFinishedEventThreshold = vi.fn();
  let service: EventRegistrationsService;

  beforeEach(() => {
    findByUserId.mockReset().mockResolvedValue([]);
    findFinishedByUserId.mockReset().mockResolvedValue({ items: [], total: 0 });
    getFinishedEventThreshold.mockReset().mockReturnValue(threshold);
    service = new EventRegistrationsService(
      { findByUserId, findFinishedByUserId } as never,
      { getFinishedEventThreshold } as never,
    );
  });

  it('preserves the existing list when scope is absent', async () => {
    await expect(
      service.findMine('user-a', { page: 2, limit: 2 }),
    ).resolves.toEqual([]);
    expect(findByUserId).toHaveBeenCalledWith('user-a');
    expect(findFinishedByUserId).not.toHaveBeenCalled();
    expect(getFinishedEventThreshold).not.toHaveBeenCalled();
  });

  it('uses the EventsService criterion and returns paginated mapped items', async () => {
    findFinishedByUserId.mockResolvedValue({ items: [registration], total: 3 });

    await expect(
      service.findMine('user-a', { scope: 'finished', page: 2, limit: 2 }),
    ).resolves.toEqual({
      data: {
        items: [
          {
            id: 'reg-a',
            eventId: 'event-a',
            eventName: 'Workshop A',
            date: registration.event.eventDate,
            startTime: registration.event.startTime,
            endTime: registration.event.endTime,
            location: 'Virtual',
            status: 'Confirmada',
            registeredAt: '2026-10-20T12:00:00.000Z',
            cancelledAt: null,
          },
        ],
        total: 3,
        limit: 2,
        totalPages: 2,
      },
      page: 2,
      offset: 2,
    });
    expect(getFinishedEventThreshold).toHaveBeenCalledOnce();
    expect(findFinishedByUserId).toHaveBeenCalledWith(
      'user-a',
      threshold,
      2,
      2,
    );
    expect(findByUserId).not.toHaveBeenCalled();
  });

  it('returns an empty page with zero total pages', async () => {
    await expect(
      service.findMine('user-a', { scope: 'finished', page: 1, limit: 10 }),
    ).resolves.toEqual({
      data: { items: [], total: 0, limit: 10, totalPages: 0 },
      page: 1,
      offset: 0,
    });
    expect(findFinishedByUserId).toHaveBeenCalledWith(
      'user-a',
      threshold,
      0,
      10,
    );
  });
});
