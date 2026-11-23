import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import type { EventSessionSchedule } from '../types/event-session-schedule.types.js';

export function toBoliviaInstant(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes) - BOLIVIA_OFFSET_MS,
  );
}

export function getScheduleStart(sessions: EventSessionSchedule[]): Date {
  return new Date(Math.min(...sessions.map((s) => s.startsAt.getTime())));
}

export function getScheduleEnd(sessions: EventSessionSchedule[]): Date {
  return new Date(Math.max(...sessions.map((s) => s.endsAt.getTime())));
}

export function hasOverlappingSessions(
  sessions: EventSessionSchedule[],
): boolean {
  const sorted = [...sessions].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
  return sorted.some(
    (session, index) =>
      index > 0 &&
      session.startsAt.getTime() < sorted[index - 1].endsAt.getTime(),
  );
}
