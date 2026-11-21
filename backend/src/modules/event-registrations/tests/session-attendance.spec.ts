import { describe, expect, it } from 'vitest';
import { resolveAttendanceSession } from '../utils/resolve-attendance-session.js';
import { AttendanceCheckInBodySchema } from '../requests/attendance-check-in.request.js';

const FIRST_ID = '44444444-4444-4444-8444-444444444444';
const SECOND_ID = '55555555-5555-4555-8555-555555555555';
const workshop = {
  eventDate: new Date('2026-12-12T00:00:00Z'),
  startTime: new Date('1970-01-01T09:00:00Z'),
  endTime: new Date('1970-01-01T12:00:00Z'),
  sessions: [
    {
      id: FIRST_ID,
      startsAt: new Date('2026-12-12T13:00:00Z'),
      endsAt: new Date('2026-12-12T16:00:00Z'),
    },
    {
      id: SECOND_ID,
      startsAt: new Date('2026-12-19T13:00:00Z'),
      endsAt: new Date('2026-12-19T16:00:00Z'),
    },
  ],
};

describe('attendance per session', () => {
  it('uses the session in progress when no session is sent', () => {
    expect(
      resolveAttendanceSession(workshop, undefined, new Date('2026-12-19T13:00:00Z')),
    ).toBe(SECOND_ID);
  });

  it('accepts the selected session only inside its own window', () => {
    expect(
      resolveAttendanceSession(workshop, FIRST_ID, new Date('2026-12-12T15:59:59Z')),
    ).toBe(FIRST_ID);
    expect(() =>
      resolveAttendanceSession(workshop, FIRST_ID, new Date('2026-12-19T14:00:00Z')),
    ).toThrow(expect.objectContaining({ code: 'ATTENDANCE_OUTSIDE_WINDOW' }));
  });

  it('treats the session end as exclusive', () => {
    expect(() =>
      resolveAttendanceSession(workshop, SECOND_ID, new Date('2026-12-19T16:00:00Z')),
    ).toThrow(expect.objectContaining({ statusCode: 409 }));
  });

  it('rejects check-in between sessions when no session is sent', () => {
    expect(() =>
      resolveAttendanceSession(workshop, undefined, new Date('2026-12-15T14:00:00Z')),
    ).toThrow(expect.objectContaining({ code: 'ATTENDANCE_OUTSIDE_WINDOW' }));
  });

  it('rejects a session that does not belong to the workshop', () => {
    expect(() =>
      resolveAttendanceSession(
        workshop,
        '66666666-6666-4666-8666-666666666666',
        new Date('2026-12-12T14:00:00Z'),
      ),
    ).toThrow(expect.objectContaining({ statusCode: 422, code: 'ATTENDANCE_SESSION_INVALID' }));
  });

  it('keeps the original window for a workshop without sessions', () => {
    const legacy = { ...workshop, sessions: [] };
    expect(resolveAttendanceSession(legacy, undefined, new Date('2026-12-12T13:00:00Z'))).toBeNull();
    expect(() =>
      resolveAttendanceSession(legacy, undefined, new Date('2026-12-12T16:00:00Z')),
    ).toThrow(expect.objectContaining({ code: 'ATTENDANCE_OUTSIDE_WINDOW' }));
    expect(() =>
      resolveAttendanceSession(legacy, FIRST_ID, new Date('2026-12-12T14:00:00Z')),
    ).toThrow(expect.objectContaining({ code: 'ATTENDANCE_SESSION_INVALID' }));
  });

  it('accepts an optional session UUID in the check-in body and rejects other values', () => {
    const reference = 'a'.repeat(64);
    expect(AttendanceCheckInBodySchema.safeParse({ reference }).success).toBe(true);
    expect(AttendanceCheckInBodySchema.safeParse({ reference, sessionId: FIRST_ID }).success).toBe(true);
    expect(AttendanceCheckInBodySchema.safeParse({ reference, sessionId: 'first' }).success).toBe(false);
  });
});
