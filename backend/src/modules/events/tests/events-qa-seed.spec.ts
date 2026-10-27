import { FixtureContext } from '../../../common/database/fixture-context.js';
import { seedEventsFixtures } from '../seeds/events-fixtures.seed.js';
import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { seedEvents } from '../seeds/events.seed.js';
import { SEED_CATEGORY_NAMES, SEED_EVENTS } from '../constants/seed-events.constants.js';

describe('seedEvents', () => {
  it('updates existing workshop content as well as creating complete workshops', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const tx = {
      eventCategory: { upsert: vi.fn().mockImplementation(({ where }: { where: { name: string } }) => Promise.resolve({ id: where.name })) },
      eventModality: { upsert: vi.fn().mockResolvedValue({ id: 'modality' }) },
      eventOrigin: { upsert: vi.fn().mockResolvedValue({ id: 'origin' }) },
      eventStatus: { upsert: vi.fn().mockResolvedValue({ id: 'status' }) },
      event: { upsert },
    };

    await seedEvents(tx as unknown as Prisma.TransactionClient, 'creator');

    expect(upsert).toHaveBeenCalledTimes(SEED_EVENTS.length);
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
      expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: event.id },
        update: expect.objectContaining(content),
        create: expect.objectContaining(content),
      }));
    }
  });

  it.each(['Empleabilidad', 'Investigación', 'Emprendimiento'])('includes workshops outside computer science in %s', (category) => {
    expect(SEED_CATEGORY_NAMES).toContain(category);
    expect(SEED_EVENTS.some((event) => SEED_CATEGORY_NAMES[event.categoryIndex] === category)).toBe(true);
  });
});


describe('Development event fixtures', () => {
  it('keeps non-computing categories represented without duplicating fixture IDs', async () => {
    const context = new FixtureContext(new Date('2026-10-25T12:00:00Z'), 'admin');
    vi.spyOn(context, 'getReference').mockImplementation((table, value) => `${table}:${value}`);
    const createMany = vi.fn().mockResolvedValue({ count: 20 });
    const tx = { event: { createMany } };
    const count = await seedEventsFixtures(tx as unknown as Prisma.TransactionClient, context);
    const data = createMany.mock.calls[0][0].data;
    expect(count).toBe(data.length);
    expect(new Set(data.map((event: { id: string }) => event.id)).size).toBe(data.length);
    for (const category of ['Empleabilidad', 'Investigación', 'Emprendimiento']) {
      expect(data.some((event: { categoryId: string }) => event.categoryId === `event_categories:${category}`)).toBe(true);
    }
    expect(createMany).toHaveBeenCalledWith({ data, skipDuplicates: true });
  });
});
