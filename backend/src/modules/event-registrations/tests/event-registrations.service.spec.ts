import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import type { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';

describe('EventRegistrationsService', () => {
  let service: EventRegistrationsService;
  const create = vi.fn();
  const findByUserId = vi.fn();

  beforeEach(() => {
    create.mockReset();
    findByUserId.mockReset();
    service = new EventRegistrationsService({
      create,
      findByUserId,
    } as unknown as EventRegistrationsRepository);
  });

  it('genera y persiste un token QR hexadecimal de 64 caracteres', async () => {
    create.mockImplementation(async (payload) => ({ id: 'reg-1', ...payload }));

    const result = await service.createWithQrToken({
      eventId: 'event-1',
      userId: 'user-1',
      statusId: 'status-1',
    });

    expect(create).toHaveBeenCalledWith({
      eventId: 'event-1',
      userId: 'user-1',
      statusId: 'status-1',
      qrToken: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(result.qrToken).toMatch(/^[a-f0-9]{64}$/);
  });

  it('genera tokens distintos para inscripciones diferentes', async () => {
    create.mockImplementation(async (payload) => ({ id: 'reg-1', ...payload }));

    const first = await service.createWithQrToken({
      eventId: 'event-1',
      userId: 'user-1',
      statusId: 'status-1',
    });
    const second = await service.createWithQrToken({
      eventId: 'event-2',
      userId: 'user-1',
      statusId: 'status-1',
    });

    expect(first.qrToken).not.toBe(second.qrToken);
  });

  it('devuelve las inscripciones del usuario mapeadas', async () => {
    findByUserId.mockResolvedValue([
      {
        id: 'reg-1',
        status: { title: 'Confirmada' },
        event: {
          title: 'Taller de NestJS',
          eventDate: new Date('2026-10-20T00:00:00.000Z'),
          location: 'Aula 101',
        },
      },
    ]);

    const result = await service.findMine('user-1');

    expect(findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([
      {
        id: 'reg-1',
        eventName: 'Taller de NestJS',
        date: new Date('2026-10-20T00:00:00.000Z'),
        location: 'Aula 101',
        status: 'Confirmada',
      },
    ]);
  });

  it('devuelve [] si el usuario no tiene inscripciones', async () => {
    findByUserId.mockResolvedValue([]);

    await expect(service.findMine('user-1')).resolves.toEqual([]);
  });
});
