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
