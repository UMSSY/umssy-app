import type { EventItem } from '../types/event-item.types';
import type { EventSession } from '../types/event-session.types';
import type { SessionSchedule } from '../types/session-schedule.types';
import { getRegistrationEventTimestamp } from './registration-format';

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

export function getSortedSessions(event: Pick<EventItem, 'sessions'>): EventSession[] {
  return (event.sessions ?? [])
    .filter((session) => toValidDate(session.startsAt) && toValidDate(session.endsAt))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

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

// Inicio de la primera sesión y fin de la última; sin sesiones usa fecha y horario del taller.
export function getScheduleBounds(schedule: {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  sessions?: EventSession[];
}): { startsAt: number; endsAt: number } {
  const sessions = getSortedSessions(schedule);
  if (sessions.length) {
    return {
      startsAt: new Date(sessions[0].startsAt).getTime(),
      endsAt: Math.max(...sessions.map((session) => new Date(session.endsAt).getTime())),
    };
  }
  return {
    startsAt: getRegistrationEventTimestamp(schedule.date, schedule.startTime ?? ''),
    endsAt: getRegistrationEventTimestamp(schedule.date, schedule.endTime ?? ''),
  };
}

// Sesión en curso o, si no hay ninguna, la siguiente por empezar.
export function getNextSession(sessions: EventSession[], now = Date.now()): EventSession | null {
  return sessions.find((session) => new Date(session.endsAt).getTime() > now) ?? null;
}

export function formatSessionLabel(sessions: EventSession[], session: EventSession): string {
  return `Sesión ${sessions.indexOf(session) + 1} · ${formatSessionDate(session)}`;
}

const sessionDayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: SESSION_TIME_ZONE,
});

// Convierte una sesión a fecha y horas locales para reutilizar los formatos del pase.
export function toSessionSchedule(session: EventSession): SessionSchedule {
  const start = toValidDate(session.startsAt);
  const end = toValidDate(session.endsAt);
  return {
    date: start ? sessionDayKeyFormat.format(start) : '',
    startTime: start ? sessionTimeFormat.format(start) : '',
    endTime: end ? sessionTimeFormat.format(end) : '',
  };
}

export function formatSessionPosition(sessions: EventSession[], session: EventSession): string {
  return `Sesión ${sessions.indexOf(session) + 1} de ${sessions.length}`;
}
