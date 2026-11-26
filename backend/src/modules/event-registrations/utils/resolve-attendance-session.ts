import { AttendanceOutsideWindowException } from '../exceptions/attendance-outside-window.exception.js';
import { AttendanceSessionInvalidException } from '../exceptions/attendance-session-invalid.exception.js';
import {
  assertAttendanceWindow,
  isAttendanceWindowOpen,
} from './assert-attendance-window.js';

type AttendanceWorkshop = {
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  sessions?: { id: string; startsAt: Date; endsAt: Date }[];
};

// Sin sessionId se prioriza la sesión en curso y luego la próxima con apertura anticipada.
export function resolveAttendanceSession(
  workshop: AttendanceWorkshop,
  sessionId: string | undefined,
  now: Date,
): string | null {
  const sessions = workshop.sessions ?? [];
  if (!sessions.length) {
    if (sessionId) throw new AttendanceSessionInvalidException();
    assertAttendanceWindow(workshop, now);
    return null;
  }
  const isOpen = (session: (typeof sessions)[number]) =>
    isAttendanceWindowOpen(
      session.startsAt.getTime(),
      session.endsAt.getTime(),
      now.getTime(),
    );
  const session = sessionId
    ? sessions.find((candidate) => candidate.id === sessionId)
    : (sessions.find(
        (candidate) =>
          now.getTime() >= candidate.startsAt.getTime() &&
          now.getTime() < candidate.endsAt.getTime(),
      ) ??
      [...sessions]
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
        .find(isOpen));
  if (!session) {
    if (sessionId) throw new AttendanceSessionInvalidException();
    throw new AttendanceOutsideWindowException();
  }
  if (!isOpen(session)) throw new AttendanceOutsideWindowException();
  return session.id;
}
