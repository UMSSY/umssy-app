import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { EVENT_ID, NOW, REGISTRATION_ID, USER_ID, registrationFixture, registrationRecord } from '../../../../test/fixtures/registration.fixture.js';

beforeEach(() => vi.useFakeTimers({ now: NOW, toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

const conflict = (code: string) => new Prisma.PrismaClientKnownRequestError('Database conflict', { code, clientVersion: 'test' });

describe('registration creation', () => {
  it('creates an owned registration with an unpredictable token in the serializable transaction', async () => {
    const { service, prisma, tx, events } = registrationFixture();
    const result = await service.create(EVENT_ID, USER_ID);
    expect(result).toEqual({
      id: REGISTRATION_ID, eventId: EVENT_ID, status: 'confirmed',
      qrToken: expect.stringMatching(/^[a-f0-9]{64}$/),
      registeredAt: '2026-10-22T10:00:00.000Z', cancelledAt: null,
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      events.findForRegistration.mock.invocationCallOrder[0],
    );
    expect(events.findForRegistration).toHaveBeenCalledWith(EVENT_ID, tx);
    expect(tx.eventRegistration.count).toHaveBeenCalledWith({ where: {
      eventId: EVENT_ID, cancelledAt: null, status: { title: 'Confirmada' },
    } });
    expect(tx.eventRegistration.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      event: { connect: { id: EVENT_ID } }, user: { connect: { id: USER_ID } },
    }) }));
    expect(result).not.toHaveProperty('userId');
  });

  it('reactivates the same row, preserves its registration date and replaces the QR', async () => {
    const { service, tx, events } = registrationFixture();
    const previous = registrationRecord({ status: { title: 'Cancelada' }, cancelledAt: NOW });
    tx.eventRegistration.findUnique.mockResolvedValue(previous);
    const result = await service.create(EVENT_ID, USER_ID);
    expect(result.id).toBe(previous.id);
    expect(result.registeredAt).toBe(previous.registeredAt.toISOString());
    expect(result.qrToken).not.toBe(previous.qrToken);
    expect(result.cancelledAt).toBeNull();
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
    expect(tx.eventRegistration.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: previous.id }, data: {
        status: { connect: { title: 'Confirmada' } }, cancelledAt: null, qrToken: result.qrToken,
      },
    }));
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      events.findForRegistration.mock.invocationCallOrder[0],
    );
  });

  it('returns an existing confirmation without consuming another seat', async () => {
    const { service, tx, event } = registrationFixture();
    event.status.title = 'Cancelado';
    event.capacity = 0;
    const existing = registrationRecord();
    tx.eventRegistration.findUnique.mockResolvedValue(existing);
    await expect(service.create(EVENT_ID, USER_ID)).resolves.toMatchObject({
      id: existing.id,
      qrToken: existing.qrToken,
      status: 'confirmed',
    });
    expect(tx.eventRegistration.count).not.toHaveBeenCalled();
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
    expect(tx.eventRegistration.update).not.toHaveBeenCalled();
  });

  it('rejects unpublished events before considering the deadline', async () => {
    const { service, event } = registrationFixture();
    event.status.title = 'Borrador';
    event.eventDate = new Date('2026-10-01');
    await expect(service.create(EVENT_ID, USER_ID)).rejects.toMatchObject({ code: 'EVENT_NOT_OPEN' });
  });

  it('closes at the Bolivia start time', async () => {
    vi.setSystemTime('2026-10-23T13:00:00.000Z');
    const { service, tx } = registrationFixture();
    await expect(service.create(EVENT_ID, USER_ID)).rejects.toMatchObject({ code: 'REGISTRATION_CLOSED', statusCode: 422 });
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
  });

  it.each(['2026-10-23T15:00:00.000Z', '2026-10-24T00:00:00.000Z'])(
    'rejects a finished event at the Bolivia end time: %s', async (now) => {
      vi.setSystemTime(now);
      const { service, tx } = registrationFixture();
      await expect(service.create(EVENT_ID, USER_ID)).rejects.toMatchObject({
        code: 'EVENT_FINISHED',
        statusCode: 422,
        message: 'El taller ya finalizó',
      });
      expect(tx.eventRegistration.create).not.toHaveBeenCalled();
    },
  );

  it('accepts the last millisecond before the start', async () => {
    vi.setSystemTime('2026-10-23T12:59:59.999Z');
    await expect(registrationFixture().service.create(EVENT_ID, USER_ID)).resolves.toMatchObject({ status: 'confirmed' });
  });

  it.each([0, 1])('rejects exhausted capacity %s without writing', async (capacity) => {
    const { service, event, tx } = registrationFixture();
    event.capacity = capacity;
    tx.eventRegistration.count.mockResolvedValue(1);
    await expect(service.create(EVENT_ID, USER_ID)).rejects.toMatchObject({ code: 'EVENT_FULL' });
    expect(tx.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('does not count registrations for unlimited capacity', async () => {
    const { service, event, tx } = registrationFixture();
    event.capacity = null;
    await service.create(EVENT_ID, USER_ID);
    expect(tx.eventRegistration.count).not.toHaveBeenCalled();
  });

  it.each(['P2034', 'P2002'])('retries %s and reevaluates the last seat', async (code) => {
    const { service, prisma, tx } = registrationFixture();
    prisma.$transaction.mockRejectedValueOnce(conflict(code));
    tx.eventRegistration.count.mockResolvedValue(1);
    await expect(service.create(EVENT_ID, USER_ID)).rejects.toMatchObject({ code: 'EVENT_FULL' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('reevaluates a unique conflict and returns the existing registration', async () => {
    const { service, prisma, tx } = registrationFixture();
    prisma.$transaction.mockRejectedValueOnce(conflict('P2002'));
    const existing = registrationRecord();
    tx.eventRegistration.findUnique.mockResolvedValue(existing);
    await expect(service.create(EVENT_ID, USER_ID)).resolves.toMatchObject({
      id: existing.id,
      qrToken: existing.qrToken,
      status: 'confirmed',
    });
  });

  it('bounds transient retries without reporting a false capacity error', async () => {
    const { service, prisma } = registrationFixture();
    prisma.$transaction.mockRejectedValue(conflict('P2034'));
    await expect(service.create(EVENT_ID, USER_ID)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it.each([new Error('Offline'), conflict('P2025')])('does not retry unrelated failures', async (error) => {
    const { service, prisma } = registrationFixture();
    prisma.$transaction.mockRejectedValue(error);
    await expect(service.create(EVENT_ID, USER_ID)).rejects.toBe(error);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('own registration lookup', () => {
  it.each([
    registrationRecord(),
    registrationRecord({ status: { title: 'Cancelada' }, cancelledAt: NOW }),
  ])('returns the persisted status: $status.title', async (record) => {
    const { service, tx, events } = registrationFixture();
    tx.eventRegistration.findUnique.mockResolvedValue(record);
    const result = await service.findOwn(EVENT_ID, USER_ID);
    expect(result.status).toBe(record.cancelledAt ? 'cancelled' : 'confirmed');
    expect(events.findForRegistration).toHaveBeenCalledWith(EVENT_ID);
    expect(tx.eventRegistration.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { eventId_userId: { eventId: EVENT_ID, userId: USER_ID } } }));
  });

  it('distinguishes no registration from a missing event', async () => {
    const { service, events, tx } = registrationFixture();
    await expect(service.findOwn(EVENT_ID, USER_ID)).rejects.toMatchObject({ code: 'REGISTRATION_NOT_FOUND' });
    tx.eventRegistration.findUnique.mockClear();
    events.findForRegistration.mockRejectedValue(new Error('Event missing'));
    await expect(service.findOwn(EVENT_ID, USER_ID)).rejects.toThrow('Event missing');
    expect(tx.eventRegistration.findUnique).not.toHaveBeenCalled();
  });
});

describe('registration cancellation', () => {
  it('performs a soft cancellation and preserves the row and QR', async () => {
    const { service, tx, event, events } = registrationFixture();
    event.status.title = 'Cancelado';
    tx.eventRegistration.findUnique.mockResolvedValue(registrationRecord());
    const result = await service.cancel(REGISTRATION_ID, USER_ID);
    expect(result).toMatchObject({ id: REGISTRATION_ID, status: 'cancelled', cancelledAt: NOW.toISOString(), qrToken: 'a'.repeat(64) });
    expect(tx.eventRegistration.update).toHaveBeenCalledWith(expect.objectContaining({ data: {
      cancelledAt: NOW, status: { connect: { title: 'Cancelada' } },
    } }));
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      events.findForRegistration.mock.invocationCallOrder[0],
    );
  });

  it.each([
    [null, 'REGISTRATION_NOT_FOUND'],
    [registrationRecord({ userId: 'another-user' }), 'REGISTRATION_NOT_OWNED'],
    [registrationRecord({ status: { title: 'Cancelada' }, cancelledAt: NOW }), 'REGISTRATION_ALREADY_CANCELLED'],
  ])('rejects cancellation with %s', async (record, code) => {
    const { service, tx, events } = registrationFixture();
    tx.eventRegistration.findUnique.mockResolvedValue(record);
    await expect(service.cancel(REGISTRATION_ID, USER_ID)).rejects.toMatchObject({ code });
    expect(tx.eventRegistration.update).not.toHaveBeenCalled();
    expect(events.findForRegistration).not.toHaveBeenCalled();
  });

  it('rejects cancellation exactly at event start', async () => {
    vi.setSystemTime('2026-10-23T13:00:00Z');
    const { service, tx } = registrationFixture();
    tx.eventRegistration.findUnique.mockResolvedValue(registrationRecord());
    await expect(service.cancel(REGISTRATION_ID, USER_ID)).rejects.toMatchObject({ code: 'REGISTRATION_CLOSED' });
    expect(tx.eventRegistration.update).not.toHaveBeenCalled();
  });
});
