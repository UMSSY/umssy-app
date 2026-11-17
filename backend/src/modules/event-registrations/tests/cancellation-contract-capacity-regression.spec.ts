import { describe, expect, it, vi } from 'vitest';
import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RegistrationAlreadyCancelledException } from '../exceptions/registration-already-cancelled.exception.js';
import { RegistrationClosedException } from '../exceptions/registration-closed.exception.js';
import { RegistrationNotOwnedException } from '../exceptions/registration-not-owned.exception.js';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';

interface StoredRegistration {
  id: string;
  eventId: string;
  userId: string;
  qrToken: string;
  registeredAt: Date;
  cancelledAt: Date | null;
  status: { title: string };
}

function buildFutureEvent(startTimestampMs: number, capacity = 1) {
  const boliviaStart = new Date(startTimestampMs + BOLIVIA_OFFSET_MS);
  const eventDate = new Date(
    Date.UTC(
      boliviaStart.getUTCFullYear(),
      boliviaStart.getUTCMonth(),
      boliviaStart.getUTCDate(),
    ),
  );
  const startTime = new Date(
    Date.UTC(
      1970,
      0,
      1,
      boliviaStart.getUTCHours(),
      boliviaStart.getUTCMinutes(),
      boliviaStart.getUTCSeconds(),
      boliviaStart.getUTCMilliseconds(),
    ),
  );
  const endTime = new Date(startTime.getTime() + 60 * 60_000);
  return {
    id: 'event-full-1',
    eventDate,
    startTime,
    endTime,
    capacity,
  };
}

describe('Cancellation contract and capacity regression (HU-08-09 / 09.7)', () => {
  it('performs logical cancellation, preserves registrationId/qrToken and frees 1 spot in a full workshop', async () => {
    const startMs = Date.now() + 2 * 60 * 60_000;
    const workshop = buildFutureEvent(startMs, 1);
    const records = new Map<string, StoredRegistration>([
      [
        'reg-1',
        {
          id: 'reg-1',
          eventId: workshop.id,
          userId: 'user-a',
          qrToken: 'a'.repeat(64),
          registeredAt: new Date('2026-11-10T10:00:00.000Z'),
          cancelledAt: null,
          status: { title: REGISTRATION_STATUS_TITLES.confirmed },
        },
      ],
    ]);

    const countConfirmed = () =>
      Array.from(records.values()).filter(
        (item) =>
          item.eventId === workshop.id &&
          item.cancelledAt === null &&
          item.status.title === REGISTRATION_STATUS_TITLES.confirmed,
      ).length;

    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn().mockResolvedValue(0),
    };

    const repository = {
      transaction: vi.fn(
        async <T>(operation: (client: typeof tx) => Promise<T>) =>
          operation(tx),
      ),
      findById: vi.fn(async (id: string) => records.get(id) ?? null),
      cancel: vi.fn(async (_client: unknown, id: string, cancelledAt: Date) => {
        const current = records.get(id)!;
        const updated: StoredRegistration = {
          ...current,
          cancelledAt,
          status: { title: REGISTRATION_STATUS_TITLES.cancelled },
        };
        records.set(id, updated);
        return updated;
      }),
    };

    const eventsService = {
      lockEventRow: vi.fn().mockResolvedValue(undefined),
      findForRegistration: vi.fn().mockResolvedValue(workshop),
      isFinished: vi.fn().mockReturnValue(false),
    };

    const service = new EventRegistrationsService(
      repository as unknown as EventRegistrationsRepository,
      eventsService as never,
    );

    expect(countConfirmed()).toBe(1);
    expect(workshop.capacity - countConfirmed()).toBe(0);

    const response = await service.cancel('reg-1', 'user-a');

    expect(response).toEqual({
      id: 'reg-1',
      eventId: workshop.id,
      status: 'cancelled',
      qrToken: 'a'.repeat(64),
      registeredAt: '2026-11-10T10:00:00.000Z',
      cancelledAt: expect.any(String),
    });
    expect(Number.isFinite(Date.parse(response.cancelledAt!))).toBe(true);
    expect(eventsService.lockEventRow).toHaveBeenCalledWith(tx, workshop.id);
    expect(countConfirmed()).toBe(0);
    expect(workshop.capacity - countConfirmed()).toBe(1);
    expect(workshop.capacity).toBe(1);

    await expect(service.cancel('reg-1', 'user-a')).rejects.toBeInstanceOf(
      RegistrationAlreadyCancelledException,
    );
    expect(countConfirmed()).toBe(0);
    expect(workshop.capacity - countConfirmed()).toBe(1);
  });

  it('rejects cancellation at the exact workshop start instant without releasing capacity', async () => {
    const startMs = Date.UTC(2026, 10, 20, 14, 0, 0);
    const workshop = buildFutureEvent(startMs, 10);
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(startMs);

    try {
      const repository = {
        transaction: vi.fn(
          async <T>(operation: (client: unknown) => Promise<T>) =>
            operation({ $queryRaw: vi.fn().mockResolvedValue([]) }),
        ),
        findById: vi.fn().mockResolvedValue({
          id: 'reg-boundary',
          eventId: workshop.id,
          userId: 'user-a',
          qrToken: 'b'.repeat(64),
          registeredAt: new Date('2026-11-10T10:00:00.000Z'),
          cancelledAt: null,
          status: { title: REGISTRATION_STATUS_TITLES.confirmed },
        }),
        cancel: vi.fn(),
      };
      const eventsService = {
        lockEventRow: vi.fn().mockResolvedValue(undefined),
        findForRegistration: vi.fn().mockResolvedValue(workshop),
        isFinished: vi.fn().mockReturnValue(false),
      };
      const service = new EventRegistrationsService(
        repository as unknown as EventRegistrationsRepository,
        eventsService as never,
      );

      await expect(
        service.cancel('reg-boundary', 'user-a'),
      ).rejects.toBeInstanceOf(RegistrationClosedException);
      expect(repository.cancel).not.toHaveBeenCalled();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('rejects cancellation from another user without altering ownership or capacity', async () => {
    const repository = {
      transaction: vi.fn(
        async <T>(operation: (client: unknown) => Promise<T>) =>
          operation({ $queryRaw: vi.fn().mockResolvedValue([]) }),
      ),
      findById: vi.fn().mockResolvedValue({
        id: 'reg-owned-by-b',
        eventId: 'event-1',
        userId: 'user-b',
        qrToken: 'c'.repeat(64),
        registeredAt: new Date('2026-11-10T10:00:00.000Z'),
        cancelledAt: null,
        status: { title: REGISTRATION_STATUS_TITLES.confirmed },
      }),
      cancel: vi.fn(),
    };
    const service = new EventRegistrationsService(
      repository as unknown as EventRegistrationsRepository,
      {
        lockEventRow: vi.fn(),
        findForRegistration: vi.fn(),
        isFinished: vi.fn(),
      } as never,
    );

    await expect(
      service.cancel('reg-owned-by-b', 'user-a'),
    ).rejects.toBeInstanceOf(RegistrationNotOwnedException);
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('queries only non-cancelled confirmed registrations when counting occupied spots', async () => {
    const count = vi.fn().mockResolvedValue(3);
    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      eventRegistration: { count, update },
    } as unknown as PrismaService;
    const repository = new EventRegistrationsRepository(prisma);
    const cancelledAt = new Date('2026-11-17T12:00:00.000Z');

    await repository.cancel(prisma, 'reg-99', cancelledAt);
    const occupied = await repository.countConfirmed(prisma, 'event-99');

    expect(occupied).toBe(3);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'reg-99' },
        data: {
          cancelledAt,
          status: { connect: { title: REGISTRATION_STATUS_TITLES.cancelled } },
        },
      }),
    );
    expect(count).toHaveBeenCalledWith({
      where: {
        eventId: 'event-99',
        cancelledAt: null,
        status: { title: REGISTRATION_STATUS_TITLES.confirmed },
      },
    });
  });
});