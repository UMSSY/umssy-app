import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('EventRegistrationsRepository', () => {
  const create = vi.fn();
  const findMany = vi.fn();
  let repository: EventRegistrationsRepository;

  beforeEach(() => {
    create.mockReset();
    findMany.mockReset();
    repository = new EventRegistrationsRepository({
      eventRegistration: { create, findMany },
    } as unknown as PrismaService);
  });

  it('persiste la inscripción con su token QR', async () => {
    const payload = {
      eventId: 'event-1',
      userId: 'user-1',
      statusId: 'status-1',
      qrToken: 'a'.repeat(64),
    };
    create.mockResolvedValue({ id: 'reg-1', ...payload });

    await repository.create(payload);

    expect(create).toHaveBeenCalledWith({
      data: payload,
      select: {
        id: true,
        eventId: true,
        userId: true,
        statusId: true,
        qrToken: true,
      },
    });
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
