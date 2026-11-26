import { FixtureContext } from '../../../common/database/fixture-context.js';
import { seedEventRegistrationsFixtures } from '../../event-registrations/seeds/event-registrations-fixtures.seed.js';
import { seedEventsFixtures } from '../seeds/events-fixtures.seed.js';
import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { seedEvents } from '../seeds/events.seed.js';
import {
  EVENT_PASS_LIFECYCLE_FIXTURES,
  REGISTRATION_CANCELLATION_FIXTURES,
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

  it('seeds the active database workshop on Monday November 23 from 08:00 to 23:00', async () => {
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
    expect(active.create.title).toBe('Taller de base de datos');
    expect(active.create.eventDate.toISOString().slice(0, 10)).toBe(
      '2026-11-23',
    );
    expect(active.create.startTime.toISOString()).toBe(
      '1970-01-01T08:00:00.000Z',
    );
    expect(active.create.endTime.toISOString()).toBe(
      '1970-01-01T23:00:00.000Z',
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
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'qa-owner' }),
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
    const scheduled = [
      ['history-interviews-2026-11-23', '2026-11-23', '18:00', '18:15'],
      ['history-git-2026-11-23', '2026-11-23', '18:15', '18:30'],
      ['history-accessibility-2026-11-23', '2026-11-23', '18:30', '18:45'],
      ['history-visualization-2026-11-23', '2026-11-23', '18:45', '19:00'],
      ['history-projects-2026-11-26', '2026-11-26', '18:00', '19:00'],
      ['advanced-architecture-2026-11-29', '2026-11-29', '06:00', '08:00'],
      ['advanced-deployment-2026-11-30', '2026-11-30', '18:00', '20:00'],
    ];
    for (const [key, date, start, end] of scheduled) {
      const workshop = data.find(
        (event: { id: string }) => event.id === context.getId(key),
      );
      expect(workshop).toMatchObject({
        createdById: 'qa-owner',
        capacity: 20,
        supportThreshold: 10,
        statusId: 'event_statuses:Votacion',
      });
      expect(workshop.eventDate.toISOString().slice(0, 10)).toBe(date);
      expect(workshop.startTime.toISOString().slice(11, 16)).toBe(start);
      expect(workshop.endTime.toISOString().slice(11, 16)).toBe(end);
    }
    const projectManagement = data.find(
      (event: { id: string }) =>
        event.id === context.getId('project-management-2026-11-29'),
    );
    expect(projectManagement).toMatchObject({
      title: 'Organizacion y gestion de proyectos',
      statusId: 'event_statuses:Publicado',
      capacity: 20,
      supportThreshold: 10,
    });
    expect(projectManagement.eventDate.toISOString()).toBe(
      '2026-11-29T00:00:00.000Z',
    );
    expect(projectManagement.startTime.toISOString()).toBe(
      '1970-01-01T05:00:00.000Z',
    );
    expect(projectManagement.endTime.toISOString()).toBe(
      '1970-01-01T20:00:00.000Z',
    );
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: context.getId('project-management-2026-11-29') },
      data: { statusId: 'event_statuses:Publicado' },
    });
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
    expect(updateMany).toHaveBeenCalledTimes(scenarios.length + 1);
  });
});
