import { AttendanceOutsideWindowException } from '../exceptions/attendance-outside-window.exception.js';
import { AttendanceSessionInvalidException } from '../exceptions/attendance-session-invalid.exception.js';
import { assertAttendanceWindow } from './assert-attendance-window.js';

type AttendanceWorkshop = {
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  sessions?: { id: string; startsAt: Date; endsAt: Date }[];
};

// Sin sessionId se usa la sesión en curso; un taller sin sesiones conserva la ventana original.
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
    now.getTime() >= session.startsAt.getTime() &&
    now.getTime() < session.endsAt.getTime();
  const session = sessionId
    ? sessions.find((candidate) => candidate.id === sessionId)
    : sessions.find(isOpen);
  if (!session) {
    if (sessionId) throw new AttendanceSessionInvalidException();
    throw new AttendanceOutsideWindowException();
  }
  if (!isOpen(session)) throw new AttendanceOutsideWindowException();
  return session.id;
}
