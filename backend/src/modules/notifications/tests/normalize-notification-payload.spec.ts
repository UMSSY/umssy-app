import { describe, expect, it } from 'vitest';
import { AppointmentParticipantRole } from '../../appointments/enums/appointment-participant-role.enum.js';
import { normalizeNotificationPayload } from '../utils/normalize-notification-payload.js';

describe('normalizeNotificationPayload', () => {
  it('formatea date y time ISO en hora de Bolivia', () => {
    expect(
      normalizeNotificationPayload({
        counterpartName: 'Ana',
        date: '2026-11-16T14:00:00Z',
        time: '2026-11-16T14:00:00Z',
        topic: 'CV',
        recipientRole: AppointmentParticipantRole.STUDENT,
      }),
    ).toEqual({
      counterpartName: 'Ana',
      date: '16/11/2026',
      time: '10:00',
      topic: 'CV',
      recipientRole: AppointmentParticipantRole.STUDENT,
    });
  });

  it('combina fecha y hora en expiresAt', () => {
    expect(
      normalizeNotificationPayload({
        offerId: 'offer-1',
        expiresAt: '2026-11-16T14:00:00.000Z',
      }),
    ).toEqual({ offerId: 'offer-1', expiresAt: '16/11/2026 a las 10:00' });
  });

  it('conserva valores que no son ISO o no representan una fecha válida', () => {
    expect(
      normalizeNotificationPayload({
        counterpartName: 'Ana',
        date: '2023-01-01',
        time: '10:00',
        topic: 'CV',
        recipientRole: AppointmentParticipantRole.STUDENT,
      }),
    ).toEqual({
      counterpartName: 'Ana',
      date: '2023-01-01',
      time: '10:00',
      topic: 'CV',
      recipientRole: AppointmentParticipantRole.STUDENT,
    });

    expect(
      normalizeNotificationPayload({
        offerId: 'offer-1',
        expiresAt: '2026-19-46T14:00:00Z',
      }),
    ).toEqual({ offerId: 'offer-1', expiresAt: '2026-19-46T14:00:00Z' });
  });

  it('no modifica el payload original', () => {
    const payload = { offerId: 'offer-1', expiresAt: '2026-11-16T14:00:00Z' };

    normalizeNotificationPayload(payload);

    expect(payload.expiresAt).toBe('2026-11-16T14:00:00Z');
  });
});