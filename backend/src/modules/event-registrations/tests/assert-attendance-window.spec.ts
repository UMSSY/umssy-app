import { describe, expect, it } from 'vitest';
import { assertAttendanceWindow } from '../utils/assert-attendance-window.js';

const schedule = {
  eventDate: new Date('2026-11-16T00:00:00.000Z'),
  startTime: new Date('1970-01-01T10:00:00.000Z'),
  endTime: new Date('1970-01-01T11:00:00.000Z'),
};

describe('assertAttendanceWindow', () => {
  it.each(['2026-11-16T14:00:00.000Z', '2026-11-16T14:59:59.999Z'])(
    'allows a scan at %s', (time) => {
      expect(() => assertAttendanceWindow(schedule, new Date(time))).not.toThrow();
    },
  );

  it.each([
    '2026-11-16T13:59:59.999Z',
    '2026-11-16T15:00:00.000Z',
    '2026-11-17T14:30:00.000Z',
    '2026-11-15T14:30:00.000Z',
  ])('rejects a scan at %s', (time) => {
    expect(() => assertAttendanceWindow(schedule, new Date(time)))
      .toThrowError(expect.objectContaining({ statusCode: 409, code: 'ATTENDANCE_OUTSIDE_WINDOW' }));
  });

  it('does not accept the preceding local calendar day for a near-midnight workshop', () => {
    const nearMidnight = {
      eventDate: new Date('2026-11-17T00:00:00.000Z'),
      startTime: new Date('1970-01-01T00:30:00.000Z'),
      endTime: new Date('1970-01-01T01:30:00.000Z'),
    };
    expect(() => assertAttendanceWindow(nearMidnight, new Date('2026-11-17T03:59:59.999Z')))
      .toThrowError(expect.objectContaining({ statusCode: 409 }));
    expect(() => assertAttendanceWindow(nearMidnight, new Date('2026-11-17T04:30:00.000Z')))
      .not.toThrow();
  });
});
