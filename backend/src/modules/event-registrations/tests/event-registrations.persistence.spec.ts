import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('EventRegistrationsService', () => {
  const findMany = vi.fn();
  let repository: EventRegistrationsService;

  beforeEach(() => {
    findMany.mockReset();
    repository = new EventRegistrationsService(new EventRegistrationsRepository({
      eventRegistration: { findMany },
    } as unknown as PrismaService), {} as never);
  });

  it('consulta por userId con el select y orden esperados', async () => {
    findMany.mockResolvedValue([]);

    await repository.findByUserId('user-1');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        cancelledAt: null,
        status: { title: 'Confirmada' },
        event: { status: { title: 'Publicado' } },
      },
      select: {
        id: true,
        registeredAt: true,
        cancelledAt: true,
        status: { select: { title: true } },
        event: {
          select: {
            title: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
      },
      orderBy: { event: { eventDate: 'asc' } },
    });
  });

  it('devuelve lo que entrega Prisma', async () => {
    const rows = [{ id: 'reg-1' }];
    findMany.mockResolvedValue(rows);

    await expect(repository.findByUserId('user-1')).resolves.toBe(rows);
  });

  it('solo lista inscripciones de eventos publicados', async () => {
    findMany.mockResolvedValue([]);

    await repository.findByUserId('user-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          event: { status: { title: 'Publicado' } },
        }),
      }),
    );
  });
});
