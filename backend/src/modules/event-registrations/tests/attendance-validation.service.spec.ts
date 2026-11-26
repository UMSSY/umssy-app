import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AttendanceValidationRepository } from '../repositories/attendance-validation.repository.js';
import { AttendanceValidationService } from '../services/attendance-validation.service.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';

const EVENT_ID = '33333333-3333-4333-8333-333333333333';
const OWNER_ID = '11111111-1111-4111-8111-111111111111';
const REGISTRATION_ID = '22222222-2222-4222-8222-222222222222';
const TOKEN = 'a'.repeat(64);
const ACTOR: AuthenticatedUser = { id: OWNER_ID, email: 'owner@example.test', roles: ['titulado'] };
const SCHEDULE = {
  eventDate: new Date('2026-11-16T00:00:00.000Z'),
  startTime: new Date('1970-01-01T10:00:00.000Z'),
  endTime: new Date('1970-01-01T11:00:00.000Z'),
};

function setup() {
  const findWorkshop = vi.fn().mockResolvedValue({ id: EVENT_ID, ...SCHEDULE });
  const findPass = vi.fn().mockResolvedValue({
    id: REGISTRATION_ID, cancelledAt: null, status: { title: 'Confirmada' },
  });
  const db = { event: { findFirst: findWorkshop }, eventRegistration: { findFirst: findPass } };
  const service = new AttendanceValidationService(
    new AttendanceValidationRepository(db as never),
    { findManagedWorkshop: (eventId: string, userId: string, tx?: typeof db) =>
      (tx ?? db).event.findFirst({
        where: { id: eventId, createdById: userId, status: { title: 'Publicado' } },
        select: { id: true, eventDate: true, startTime: true, endTime: true },
      }) } as never,
  );
  return { service, findWorkshop, findPass, db };
}

describe('AttendanceValidationService', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-16T14:30:00.000Z')); });
  afterEach(() => vi.useRealTimers());
  it('resolves an active pass only for its published workshop creator', async () => {
    const { service, findWorkshop, findPass } = setup();
    await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, `V1:${TOKEN.toUpperCase()}`))
      .resolves.toEqual({ registrationId: REGISTRATION_ID, sessionId: null });
    expect(findWorkshop).toHaveBeenCalledWith({
      where: { id: EVENT_ID, createdById: OWNER_ID, status: { title: 'Publicado' } },
      select: { id: true, eventDate: true, startTime: true, endTime: true },
    });
    expect(findPass).toHaveBeenCalledWith({
      where: { eventId: EVENT_ID, qrToken: TOKEN },
      select: { id: true, cancelledAt: true, status: { select: { title: true } } },
    });
  });

  it('looks up a manual UUID only within the workshop managed by the actor', async () => {
    const { service, findPass } = setup();
    await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, REGISTRATION_ID))
      .resolves.toEqual({ registrationId: REGISTRATION_ID, sessionId: null });
    expect(findPass).toHaveBeenCalledWith(expect.objectContaining({
      where: { eventId: EVENT_ID, id: REGISTRATION_ID },
    }));
  });

  it.each(['administrativo', 'mentor'])(
    'rejects a caller with only the %s role before any database read', async (role) => {
      const { service, findWorkshop, findPass } = setup();
      await expect(service.resolveForCheckIn(EVENT_ID, { ...ACTOR, roles: [role] }, TOKEN))
        .rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN_ROLE' });
      expect(findWorkshop).not.toHaveBeenCalled();
      expect(findPass).not.toHaveBeenCalled();
    },
  );

  it('rejects a missing or unassigned workshop without looking up the reference', async () => {
    const { service, findWorkshop, findPass } = setup();
    findWorkshop.mockResolvedValue(null);
    await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, REGISTRATION_ID))
      .rejects.toMatchObject({ statusCode: 403, code: 'ATTENDANCE_ACCESS_DENIED' });
    expect(findPass).not.toHaveBeenCalled();
  });

  it('rejects malformed event identifiers and references without accessing passes', async () => {
    const { service, findWorkshop, findPass } = setup();
    await expect(service.resolveForCheckIn('bad-event-id', ACTOR, TOKEN))
      .rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(findWorkshop).not.toHaveBeenCalled();
    await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, 'K7M4-R9TX-2Q8P'))
      .rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(findPass).not.toHaveBeenCalled();
  });

  it.each([TOKEN, REGISTRATION_ID])(
    'uses the same generic error for an absent pass or a reference from another workshop', async (reference) => {
      const { service, findPass } = setup();
      findPass.mockResolvedValue(null);
      await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, reference))
        .rejects.toMatchObject({ statusCode: 422, code: 'ATTENDANCE_PASS_INVALID', message: 'Pase inválido.' });
      expect(findPass).toHaveBeenCalledWith(expect.objectContaining({
        where: { eventId: EVENT_ID, ...(reference === TOKEN ? { qrToken: TOKEN } : { id: REGISTRATION_ID }) },
      }));
    },
  );

  it.each([TOKEN, REGISTRATION_ID])(
    'distinguishes a cancelled pass only within the authorized workshop', async (reference) => {
      const { service, findPass } = setup();
      findPass.mockResolvedValue({ id: REGISTRATION_ID, cancelledAt: new Date(), status: { title: 'Cancelada' } });
      await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, reference))
        .rejects.toMatchObject({ statusCode: 422, code: 'ATTENDANCE_PASS_CANCELLED' });
    },
  );

  it('rejects other non-confirmed registration statuses', async () => {
    const { service, findPass } = setup();
    findPass.mockResolvedValue({ id: REGISTRATION_ID, cancelledAt: null, status: { title: 'Pendiente' } });
    await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, TOKEN))
      .rejects.toMatchObject({ statusCode: 422, code: 'ATTENDANCE_PASS_INVALID' });
  });

  it.each([
    '2026-11-16T13:29:59.999Z',
    '2026-11-16T15:00:00.000Z',
    '2026-11-17T14:30:00.000Z',
  ])('rejects a confirmed pass outside the local workshop window at %s', async (instant) => {
    const { service, findPass } = setup();
    await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, TOKEN, undefined, new Date(instant)))
      .rejects.toMatchObject({ statusCode: 409, code: 'ATTENDANCE_OUTSIDE_WINDOW' });
    expect(findPass).toHaveBeenCalledOnce();
  });

  it.each(['2026-11-16T13:30:00.000Z', '2026-11-16T13:59:59.999Z', '2026-11-16T14:00:00.000Z', '2026-11-16T14:59:59.999Z'])(
    'accepts a confirmed pass inside the local workshop window at %s', async (instant) => {
      const { service } = setup();
      await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, TOKEN, undefined, new Date(instant)))
        .resolves.toEqual({ registrationId: REGISTRATION_ID, sessionId: null });
    },
  );

  it('can execute both reads on the same transaction supplied by the check-in service', async () => {
    const { service, db } = setup();
    const eventFindFirst = vi.fn().mockResolvedValue({ id: EVENT_ID, ...SCHEDULE });
    const registrationFindFirst = vi.fn().mockResolvedValue({ id: REGISTRATION_ID, cancelledAt: null, status: { title: 'Confirmada' } });
    const tx = { event: { findFirst: eventFindFirst }, eventRegistration: { findFirst: registrationFindFirst } };
    await expect(service.resolveForCheckIn(EVENT_ID, ACTOR, TOKEN, tx as never))
      .resolves.toEqual({ registrationId: REGISTRATION_ID, sessionId: null });
    expect(eventFindFirst).toHaveBeenCalledOnce();
    expect(registrationFindFirst).toHaveBeenCalledOnce();
    expect(db.event.findFirst).not.toHaveBeenCalled();
    expect(db.eventRegistration.findFirst).not.toHaveBeenCalled();
  });
});
