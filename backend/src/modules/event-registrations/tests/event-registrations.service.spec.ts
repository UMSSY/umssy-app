import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRegistrationsService } from '../services/event-registrations.service.js';

describe('EventRegistrationsService', () => {
  let service: EventRegistrationsService;
  const create = vi.fn();
  const findByUserId = vi.fn();
  const findFinishedEventIds = vi.fn();

  beforeEach(() => {
    create.mockReset();
    findByUserId.mockReset();
    findFinishedEventIds.mockReset().mockResolvedValue([]);
    service = new EventRegistrationsService(
      new EventRegistrationsRepository({
        eventRegistration: { create },
      } as never),
      { findFinishedEventIds } as never,
    );
    vi.spyOn(service, 'findByUserId').mockImplementation(findByUserId);
  });

  it('genera y persiste un token QR hexadecimal de 64 caracteres', async () => {
    create.mockImplementation(async ({ data }) => ({ id: 'reg-1', ...data }));

    const result = await service.createWithQrToken({
      eventId: 'event-1',
      userId: 'user-1',
      statusId: 'status-1',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        eventId: 'event-1',
        userId: 'user-1',
        statusId: 'status-1',
        qrToken: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
      select: {
        id: true,
        eventId: true,
        userId: true,
        statusId: true,
        qrToken: true,
      },
    });
    expect(result.qrToken).toMatch(/^[a-f0-9]{64}$/);
  });

  it('genera tokens distintos para inscripciones diferentes', async () => {
    create.mockImplementation(async ({ data }) => ({ id: 'reg-1', ...data }));

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
        eventId: 'event-1',
        registeredAt: new Date('2026-10-18T10:00:00.000Z'),
        cancelledAt: null,
        status: { title: 'Confirmada' },
        event: {
          title: 'Taller de NestJS',
          eventDate: new Date('2026-10-20T00:00:00.000Z'),
          startTime: new Date('1970-01-01T10:00:00.000Z'),
          endTime: new Date('1970-01-01T12:00:00.000Z'),
          location: 'Aula 101',
        },
      },
    ]);

    const result = await service.findMine('user-1');

    expect(findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([
      {
        id: 'reg-1',
        eventId: 'event-1',
        eventName: 'Taller de NestJS',
        date: new Date('2026-10-20T00:00:00.000Z'),
        startTime: new Date('1970-01-01T10:00:00.000Z'),
        endTime: new Date('1970-01-01T12:00:00.000Z'),
        location: 'Aula 101',
        status: 'Confirmada',
        registeredAt: '2026-10-18T10:00:00.000Z',
        cancelledAt: null,
      },
    ]);
    expect(findFinishedEventIds).toHaveBeenCalledWith(
      ['event-1'],
      expect.any(Date),
    );
  });

  it('excludes registrations for finished events without changing other registrations', async () => {
    findByUserId.mockResolvedValue([
      {
        id: 'registration-upcoming',
        eventId: 'event-upcoming',
        registeredAt: new Date('2026-10-18T10:00:00.000Z'),
        cancelledAt: null,
        status: { title: 'Confirmada' },
        event: {
          title: 'Taller futuro',
          eventDate: new Date('2026-10-21T00:00:00.000Z'),
          startTime: new Date('1970-01-01T10:00:00.000Z'),
          endTime: new Date('1970-01-01T12:00:00.000Z'),
          location: 'Aula 101',
        },
      },
      {
        id: 'registration-finished',
        eventId: 'event-finished',
        registeredAt: new Date('2026-10-18T10:00:00.000Z'),
        cancelledAt: null,
        status: { title: 'Confirmada' },
        event: {
          title: 'Taller finalizado',
          eventDate: new Date('2026-10-19T00:00:00.000Z'),
          startTime: new Date('1970-01-01T10:00:00.000Z'),
          endTime: new Date('1970-01-01T12:00:00.000Z'),
          location: 'Aula 101',
        },
      },
    ]);
    findFinishedEventIds.mockResolvedValue(['event-finished']);

    const result = await service.findMine('user-1');

    expect(findFinishedEventIds).toHaveBeenCalledWith(
      ['event-upcoming', 'event-finished'],
      expect.any(Date),
    );
    expect(result.map(({ id }) => id)).toEqual(['registration-upcoming']);
  });

  it('devuelve [] si el usuario no tiene inscripciones', async () => {
    findByUserId.mockResolvedValue([]);

    await expect(service.findMine('user-1')).resolves.toEqual([]);
    expect(findFinishedEventIds).not.toHaveBeenCalled();
  });
});
