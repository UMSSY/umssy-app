import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { buildHistoryEventScenarios, HISTORY_EVENT_IDS } from '../constants/history-scenarios.constants.js';
import { seedHistoryScenarioEvents } from '../seeds/history-scenarios-events.seed.js';
import { EventsService } from '../services/events.service.js';
import type { EventsRepository } from '../repositories/events.repository.js';

describe('history scenario events', () => {
  const now = new Date('2026-11-20T15:00:00.000Z');

  it('builds twelve distinct past workshops and a UTC midnight boundary', () => {
    const scenarios = buildHistoryEventScenarios(now);
    expect(scenarios.historical).toHaveLength(13);
    expect(new Set(scenarios.historical.map((event) => event.id)).size).toBe(13);
    expect(scenarios.historical.slice(0, 12).every((event) => event.eventDate < now)).toBe(true);
    expect(scenarios.historical[1].title).toBe(scenarios.historical[2].title);
    expect(scenarios.historical[1].id).not.toBe(scenarios.historical[2].id);
    expect(scenarios.historical[3].title).toHaveLength(80);
    expect(scenarios.historical[3].location).toHaveLength(150);
    expect(scenarios.boundary.startsAt.toISOString()).toBe('2026-11-20T23:40:00.000Z');
    expect(scenarios.boundary.endsAt.toISOString()).toBe('2026-11-21T00:20:00.000Z');
    expect(scenarios.boundary.eventDate.toISOString()).toBe('2026-11-20T00:00:00.000Z');
    expect(scenarios.future.eventDate > now).toBe(true);
    expect(buildHistoryEventScenarios(new Date('2027-01-01T12:00:00Z')).future.eventDate > new Date('2027-01-01T12:00:00Z')).toBe(true);
  });

  it('creates historical events once and refreshes only dynamic dates', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 14 });
    const upsert = vi.fn().mockResolvedValue({});
    const sessionUpsert = vi.fn().mockResolvedValue({});
    const findUniqueOrThrow = vi.fn().mockResolvedValue({ id: 'catalog' });
    const tx = {
      eventCategory: { findUniqueOrThrow },
      eventModality: { findUniqueOrThrow },
      eventOrigin: { findUniqueOrThrow },
      eventStatus: { findUniqueOrThrow },
      event: { createMany, upsert },
      eventSession: { upsert: sessionUpsert },
    };
    await seedHistoryScenarioEvents(tx as unknown as Prisma.TransactionClient, 'creator', now);
    expect(createMany).toHaveBeenCalledWith({ data: expect.arrayContaining([expect.objectContaining({ id: HISTORY_EVENT_IDS.historical[0] })]), skipDuplicates: true });
    expect(createMany.mock.calls[0][0].data).toHaveLength(14);
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(sessionUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: HISTORY_EVENT_IDS.boundarySession },
      update: { startsAt: new Date('2026-11-20T23:40:00.000Z'), endsAt: new Date('2026-11-21T00:20:00.000Z') },
    }));
  });

  it('crosses UTC midnight before, during, and exactly after the controlled session', () => {
    const boundary = buildHistoryEventScenarios(now).boundary;
    const event = {
      eventDate: boundary.eventDate,
      endTime: boundary.endTime,
      sessions: [{ startsAt: boundary.startsAt, endsAt: boundary.endsAt }],
    };
    const service = new EventsService({} as EventsRepository);
    expect(service.isFinished(event, new Date('2026-11-20T23:39:59.000Z'))).toBe(false);
    expect(service.isFinished(event, new Date('2026-11-21T00:00:00.000Z'))).toBe(false);
    expect(service.isFinished(event, boundary.endsAt)).toBe(true);
    expect(service.isFinished(event, new Date('2026-11-21T00:20:01.000Z'))).toBe(true);
  });
});
