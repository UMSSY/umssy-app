import type { EventItem } from '../types/event-item.types';
import type { EventSession } from '../types/event-session.types';

// Los horarios de las sesiones se muestran en la hora local de Bolivia.
const SESSION_TIME_ZONE = 'America/La_Paz';

const sessionDateFormat = new Intl.DateTimeFormat('es-BO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: SESSION_TIME_ZONE,
});

const sessionRangeFormat = new Intl.DateTimeFormat('es-BO', {
  day: 'numeric',
  month: 'long',
  timeZone: SESSION_TIME_ZONE,
});

const sessionTimeFormat = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: SESSION_TIME_ZONE,
});

function toValidDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

// Sesiones válidas ordenadas por inicio; un taller sin sesiones devuelve [].
export function getSortedSessions(event: Pick<EventItem, 'sessions'>): EventSession[] {
  return (event.sessions ?? [])
    .filter((session) => toValidDate(session.startsAt) && toValidDate(session.endsAt))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

// Solo los talleres con más de una sesión usan la presentación multisesión.
export function hasMultipleSessions(event: Pick<EventItem, 'sessions'>): boolean {
  return getSortedSessions(event).length > 1;
}

export function formatSessionCount(count: number): string {
  return count === 1 ? '1 sesión' : `${count} sesiones`;
}

export function formatSessionDate(session: EventSession): string {
  const start = toValidDate(session.startsAt);
  return start ? sessionDateFormat.format(start) : 'Fecha por confirmar';
}

export function formatSessionTimeRange(session: EventSession): string {
  const start = toValidDate(session.startsAt);
  const end = toValidDate(session.endsAt);
  if (!start || !end) return 'Horario no disponible';
  return `${sessionTimeFormat.format(start)} - ${sessionTimeFormat.format(end)} hrs`;
}

// Rango entre la primera y la última sesión, por ejemplo "1–5 de diciembre".
export function formatSessionDateRange(sessions: EventSession[]): string {
  const first = sessions[0] && toValidDate(sessions[0].startsAt);
  const last = sessions.at(-1) && toValidDate(sessions.at(-1)!.startsAt);
  if (!first || !last) return 'Fecha por confirmar';
  return sessionRangeFormat.formatRange(first, last);
}
