import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { AttendanceCheckInRepository } from '../repositories/attendance-check-in.repository.js';
import { AttendanceCheckInService } from '../services/attendance-check-in.service.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { AttendanceOutsideWindowException } from '../exceptions/attendance-outside-window.exception.js';

const EVENT_ID = '33333333-3333-4333-8333-333333333333';
const REGISTRATION_ID = '22222222-2222-4222-8222-222222222222';
const ACTOR: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'owner@example.test',
  roles: ['titulado'],
};
const REFERENCE = 'a'.repeat(64);
const SESSION_ID = '44444444-4444-4444-8444-444444444444';
const ORIGINAL_TIME = new Date('2026-11-16T14:20:00.000Z');

function setup() {
  const tx = {};
  const repository = {
    transaction: vi.fn((operation: (tx: never) => Promise<unknown>) => operation(tx as never)),
    lockRegistration: vi.fn().mockResolvedValue(true),
    insertIfAbsent: vi.fn().mockResolvedValue({ count: 1 }),
    findAttendance: vi.fn().mockResolvedValue({ checkedInAt: ORIGINAL_TIME }),
  };
  const validation = {
    resolveForCheckIn: vi.fn().mockResolvedValue({ registrationId: REGISTRATION_ID, sessionId: SESSION_ID }),
  };
  const service = new AttendanceCheckInService(repository as never, validation as never);
  return { service, repository, validation, tx };
}

describe('AttendanceCheckInService', () => {
  it('persists one online attendance with the authenticated actor and server time', async () => {
    const { service, repository, validation, tx } = setup();
    await expect(service.checkIn(EVENT_ID, ACTOR, REFERENCE, SESSION_ID)).resolves.toEqual({
      result: 'registered', checkedInAt: ORIGINAL_TIME.toISOString(), sessionId: SESSION_ID,
    });
    expect(validation.resolveForCheckIn).toHaveBeenCalledTimes(2);
    expect(validation.resolveForCheckIn).toHaveBeenNthCalledWith(1, EVENT_ID, ACTOR, REFERENCE, tx, undefined, SESSION_ID);
    const checkedInAt = validation.resolveForCheckIn.mock.calls[1][4];
    expect(checkedInAt).toBeInstanceOf(Date);
    expect(validation.resolveForCheckIn).toHaveBeenNthCalledWith(2, EVENT_ID, ACTOR, REFERENCE, tx, checkedInAt, SESSION_ID);
    expect(repository.lockRegistration).toHaveBeenCalledWith(tx, EVENT_ID, REGISTRATION_ID);
    expect(repository.insertIfAbsent).toHaveBeenCalledWith(tx, REGISTRATION_ID, SESSION_ID, ACTOR.id, checkedInAt);
    expect(repository.findAttendance).toHaveBeenCalledWith(tx, REGISTRATION_ID, SESSION_ID);
    expect(repository.lockRegistration.mock.invocationCallOrder[0])
      .toBeLessThan(repository.insertIfAbsent.mock.invocationCallOrder[0]);
  });

  it('returns duplicate with the original timestamp without changing the existing row', async () => {
    const { service, repository } = setup();
    repository.insertIfAbsent.mockResolvedValue({ count: 0 });
    await expect(service.checkIn(EVENT_ID, ACTOR, REFERENCE, SESSION_ID)).resolves.toEqual({
      result: 'duplicate', checkedInAt: ORIGINAL_TIME.toISOString(), sessionId: SESSION_ID,
    });
    expect(repository.insertIfAbsent).toHaveBeenCalledTimes(1);
  });

  it('does not write if the pass is cancelled while waiting for the lock', async () => {
    const { service, repository, validation } = setup();
    validation.resolveForCheckIn.mockResolvedValueOnce({ registrationId: REGISTRATION_ID })
      .mockRejectedValueOnce({ code: 'ATTENDANCE_PASS_CANCELLED' });
    await expect(service.checkIn(EVENT_ID, ACTOR, REFERENCE))
      .rejects.toMatchObject({ code: 'ATTENDANCE_PASS_CANCELLED' });
    expect(repository.insertIfAbsent).not.toHaveBeenCalled();
  });

  it('does not write if the window closes while waiting for the lock', async () => {
    const { service, repository, validation } = setup();
    validation.resolveForCheckIn.mockResolvedValueOnce({ registrationId: REGISTRATION_ID })
      .mockRejectedValueOnce(new AttendanceOutsideWindowException());
    await expect(service.checkIn(EVENT_ID, ACTOR, REFERENCE))
      .rejects.toMatchObject({ statusCode: 409, code: 'ATTENDANCE_OUTSIDE_WINDOW' });
    expect(repository.insertIfAbsent).not.toHaveBeenCalled();
  });

  it('does not write if the registration disappears or the reference changes after locking', async () => {
    const { service, repository } = setup();
    repository.lockRegistration.mockResolvedValue(false);
    await expect(service.checkIn(EVENT_ID, ACTOR, REFERENCE))
      .rejects.toMatchObject({ code: 'ATTENDANCE_PASS_INVALID' });
    expect(repository.insertIfAbsent).not.toHaveBeenCalled();
  });

  it('does not write if the reference resolves to a different registration after locking', async () => {
    const { service, repository, validation } = setup();
    validation.resolveForCheckIn.mockResolvedValueOnce({ registrationId: REGISTRATION_ID })
      .mockResolvedValueOnce({ registrationId: 'different-registration' });
    await expect(service.checkIn(EVENT_ID, ACTOR, REFERENCE))
      .rejects.toMatchObject({ code: 'ATTENDANCE_PASS_INVALID' });
    expect(repository.insertIfAbsent).not.toHaveBeenCalled();
  });
});

describe('AttendanceCheckInRepository', () => {
  it('uses a read-committed transaction, a scoped row lock and conflict-safe insertion per session', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ id: REGISTRATION_ID }]);
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const findFirst = vi.fn().mockResolvedValue({ checkedInAt: ORIGINAL_TIME });
    const tx = { $queryRaw: queryRaw, eventAttendance: { createMany, findFirst } };
    const transaction = vi.fn((operation: (tx: never) => Promise<unknown>) => operation(tx as never));
    const repository = new AttendanceCheckInRepository({ $transaction: transaction } as never);
    await repository.transaction(async (client) => {
      expect(await repository.lockRegistration(client, EVENT_ID, REGISTRATION_ID)).toBe(true);
      await repository.insertIfAbsent(client, REGISTRATION_ID, SESSION_ID, ACTOR.id, ORIGINAL_TIME);
      await repository.findAttendance(client, REGISTRATION_ID, SESSION_ID);
    });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });
    const [sql, id, eventId] = queryRaw.mock.calls[0];
    expect(sql.join('?')).toContain('FOR UPDATE');
    expect(id).toBe(REGISTRATION_ID);
    expect(eventId).toBe(EVENT_ID);
    expect(createMany).toHaveBeenCalledWith({
      data: {
        registrationId: REGISTRATION_ID,
        sessionId: SESSION_ID,
        checkedInAt: ORIGINAL_TIME,
        checkedInById: ACTOR.id,
        checkedInOffline: false,
        syncedAt: null,
      },
      skipDuplicates: true,
    });
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst).toHaveBeenCalledWith({
      where: { registrationId: REGISTRATION_ID, sessionId: SESSION_ID }, select: { checkedInAt: true },
    });
  });

  it('does not insert a second attendance without session for the same registration', async () => {
    const createMany = vi.fn();
    const findFirst = vi.fn().mockResolvedValue({ checkedInAt: ORIGINAL_TIME });
    const repository = new AttendanceCheckInRepository({} as never);
    await expect(
      repository.insertIfAbsent({ eventAttendance: { createMany, findFirst } } as never, REGISTRATION_ID, null, ACTOR.id, ORIGINAL_TIME),
    ).resolves.toEqual({ count: 0 });
    expect(findFirst).toHaveBeenCalledWith({
      where: { registrationId: REGISTRATION_ID, sessionId: null }, select: { checkedInAt: true },
    });
    expect(createMany).not.toHaveBeenCalled();
  });
});
