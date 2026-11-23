import { FixtureContext } from '../../../common/database/fixture-context.js';
import { seedEventRegistrationsFixtures } from '../../event-registrations/seeds/event-registrations-fixtures.seed.js';
import { seedEventsFixtures } from '../seeds/events-fixtures.seed.js';
import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { seedEvents } from '../seeds/events.seed.js';
import {
  EVENT_PASS_LIFECYCLE_FIXTURES,
  REGISTRATION_CANCELLATION_FIXTURES,
  getUpcomingPassSchedule,
  seedEventPassLifecycleEvents,
} from '../seeds/event-pass-lifecycle-fixtures.seed.js';
import {
  SEED_CATEGORY_NAMES,
  SEED_EVENTS,
} from '../constants/seed-events.constants.js';

describe('seedEvents', () => {
  it('updates existing workshop content as well as creating complete workshops', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const tx = {
      eventCategory: {
        upsert: vi
          .fn()
          .mockImplementation(({ where }: { where: { name: string } }) =>
            Promise.resolve({ id: where.name }),
          ),
      },
      eventModality: { upsert: vi.fn().mockResolvedValue({ id: 'modality' }) },
      eventOrigin: { upsert: vi.fn().mockResolvedValue({ id: 'origin' }) },
      eventStatus: { upsert: vi.fn().mockResolvedValue({ id: 'status' }) },
      event: { upsert },
    };

    await seedEvents(tx as unknown as Prisma.TransactionClient, 'creator');

    expect(upsert).toHaveBeenCalledTimes(
      SEED_EVENTS.length +
        EVENT_PASS_LIFECYCLE_FIXTURES.length +
        REGISTRATION_CANCELLATION_FIXTURES.length,
    );
    for (const event of SEED_EVENTS) {
      expect(event.capacity).toBeGreaterThanOrEqual(20);
      expect(event.capacity).toBeLessThanOrEqual(60);
      expect(event.description).toContain('Prerrequisitos:');
      expect(event.description).toContain('Materiales:');
      expect(event.location.split(',')).toHaveLength(2);
      const content = {
        description: event.description,
        instructorName: event.instructorName,
        location: event.location,
        capacity: event.capacity,
        categoryId: SEED_CATEGORY_NAMES[event.categoryIndex],
      };
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: event.id },
          update: expect.objectContaining(content),
          create: expect.objectContaining(content),
        }),
      );
    }
  });

  it('starts the active pass five minutes after the seed and closes it one minute later', async () => {
    const now = new Date('2026-10-25T02:00:20.123Z');
    const schedule = getUpcomingPassSchedule(now);
    const startMinute =
      schedule.startTime.getUTCHours() * 60 +
      schedule.startTime.getUTCMinutes();
    const closeMinute =
      schedule.endTime.getUTCHours() * 60 + schedule.endTime.getUTCMinutes();

    expect(schedule.eventDate.toISOString().slice(0, 10)).toBe('2026-10-24');
    expect(startMinute).toBe(22 * 60 + 5);
    expect(closeMinute - startMinute).toBe(1);
    expect(
      Date.UTC(
        2026,
        9,
        24,
        schedule.startTime.getUTCHours() + 4,
        schedule.startTime.getUTCMinutes(),
        schedule.startTime.getUTCSeconds(),
        schedule.startTime.getUTCMilliseconds(),
      ),
    ).toBe(now.getTime() + 5 * 60_000);
  });

  it('keeps the active one-minute schedule on the same event day around midnight', () => {
    const schedule = getUpcomingPassSchedule(
      new Date('2026-10-25T03:59:30.000Z'),
    );
    expect(schedule.eventDate.toISOString().slice(0, 10)).toBe('2026-10-25');
    expect(schedule.startTime.toISOString()).toBe('1970-01-01T00:04:30.000Z');
    expect(schedule.endTime.toISOString()).toBe('1970-01-01T00:05:30.000Z');
  });

  it('creates recognizable lifecycle passes with dates based on Bolivia time', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const count = await seedEventPassLifecycleEvents(
      { event: { upsert } } as never,
      {
        createdById: 'creator',
        categoryId: 'technology',
        modalityId: 'in-person',
        originId: 'institutional',
        statusId: 'published',
        now: new Date('2026-10-25T02:00:00.000Z'),
      },
    );

    expect(count).toBe(2);
    expect(upsert).toHaveBeenCalledTimes(2);
    const [active, finished] = upsert.mock.calls.map(([args]) => args);
    expect(active.where.id).toBe('fb69db6e-ded6-4eed-85ef-6135cf88fad4');
    expect(active.create.title).toBe('[QA 08.5] Pase vigente');
    expect(active.create.eventDate.toISOString().slice(0, 10)).toBe(
      '2026-10-24',
    );
    expect(active.create.startTime.toISOString()).toBe(
      '1970-01-01T22:05:00.000Z',
    );
    expect(active.create.endTime.toISOString()).toBe(
      '1970-01-01T22:06:00.000Z',
    );
    expect(finished.where.id).toBe('66f39ba1-ebc1-42b9-9169-e773f2eb3d2b');
    expect(finished.create.title).toBe('[QA 08.5] Pase finalizado por horario');
    expect(finished.create.eventDate.toISOString().slice(0, 10)).toBe(
      '2026-10-23',
    );
    expect(finished.create.statusId).toBe('published');
  });

  it.each(['Empleabilidad', 'Investigación', 'Emprendimiento'])(
    'includes workshops outside computer science in %s',
    (category) => {
      expect(SEED_CATEGORY_NAMES).toContain(category);
      expect(
        SEED_EVENTS.some(
          (event) => SEED_CATEGORY_NAMES[event.categoryIndex] === category,
        ),
      ).toBe(true);
    },
  );
});

describe('Development event fixtures', () => {
  it('leaves the QA workshop in voting with one support remaining', async () => {
    const context = new FixtureContext(
      new Date('2026-11-19T12:00:00Z'),
      'admin',
    );
    vi.spyOn(context, 'getReference').mockImplementation(
      (table, value) => `${table}:${value}`,
    );
    const createMany = vi.fn().mockResolvedValue({ count: 21 });
    await seedEventsFixtures(
      {
        user: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: 'qa-owner', isActive: true }),
        },
        event: {
          createMany,
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      } as never,
      context,
    );
    const workshop = createMany.mock.calls[0]![0].data.find(
      (event: { id: string }) =>
        event.id === context.getId('qa-workshop-2026-11-19'),
    );
    expect(workshop).toMatchObject({
      createdById: 'qa-owner',
      capacity: 20,
      supportThreshold: 10,
      statusId: 'event_statuses:Votacion',
    });
    expect(workshop.eventDate.toISOString().slice(0, 10)).toBe('2026-11-19');
  });
  it('keeps non-computing categories represented without duplicating fixture IDs', async () => {
    const context = new FixtureContext(
      new Date('2026-10-25T12:00:00Z'),
      'admin',
    );
    vi.spyOn(context, 'getReference').mockImplementation(
      (table, value) => `${table}:${value}`,
    );
    const createMany = vi.fn().mockResolvedValue({ count: 20 });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'qa-owner', isActive: true }),
      },
      event: { createMany, updateMany },
    };
    const count = await seedEventsFixtures(
      tx as unknown as Prisma.TransactionClient,
      context,
    );
    const data = createMany.mock.calls[0][0].data;
    expect(count).toBe(data.length);
    expect(new Set(data.map((event: { id: string }) => event.id)).size).toBe(
      data.length,
    );
    for (const category of [
      'Empleabilidad',
      'Investigación',
      'Emprendimiento',
    ]) {
      expect(
        data.some(
          (event: { categoryId: string }) =>
            event.categoryId === `event_categories:${category}`,
        ),
      ).toBe(true);
    }
    expect(createMany).toHaveBeenCalledWith({ data, skipDuplicates: true });
  });

  it('keeps full and one-spot workshop capacities when fixture events already exist', async () => {
    const context = new FixtureContext(
      new Date('2026-10-25T12:00:00Z'),
      'admin',
    );
    vi.spyOn(context, 'getReference').mockImplementation(
      (table, value) => `${table}:${value}`,
    );
    const eventCreateMany = vi.fn().mockResolvedValue({ count: 0 });
    const registrationCreateMany = vi.fn().mockResolvedValue({ count: 0 });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'qa-owner', isActive: true }),
      },
      event: {
        createMany: eventCreateMany,
        updateMany,
        findUnique: vi.fn().mockResolvedValue(null),
      },
      eventRegistration: {
        createMany: registrationCreateMany,
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    await seedEventsFixtures(
      tx as unknown as Prisma.TransactionClient,
      context,
    );
    await seedEventRegistrationsFixtures(
      tx as unknown as Prisma.TransactionClient,
      context,
    );

    const events = eventCreateMany.mock.calls[0][0]
      .data as Prisma.EventCreateManyInput[];
    const registrations = registrationCreateMany.mock.calls[0][0]
      .data as Prisma.EventRegistrationCreateManyInput[];
    const scenarios = [
      { key: 'record-01700', capacity: 13, availableSpots: 0 },
      { key: 'record-00376', capacity: 14, availableSpots: 1 },
    ];

    for (const scenario of scenarios) {
      const id = context.getId(scenario.key);
      const event = events.find((item) => item.id === id);
      const confirmedCount = registrations.filter(
        (registration) =>
          registration.eventId === id &&
          registration.statusId === 'registration_statuses:Confirmada' &&
          registration.cancelledAt === null,
      ).length;

      expect(event?.statusId).toBe('event_statuses:Publicado');
      expect(event?.capacity).toBe(scenario.capacity);
      expect(scenario.capacity - confirmedCount).toBe(scenario.availableSpots);
      expect(updateMany).toHaveBeenCalledWith({
        where: { id },
        data: { capacity: scenario.capacity },
      });
    }
    expect(updateMany).toHaveBeenCalledTimes(scenarios.length);
  });
});
