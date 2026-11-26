import { BOLIVIA_TIME_ZONE } from "@/shared/constants/date-time.constants";
import type { EventDisplayStatus } from '../types/event-display-status.types';
export type { EventDisplayStatus } from '../types/event-display-status.types';
import type { EventItem } from '../types/event-item.types';
import { calculateEventCapacityStatus } from './event-card';
import { getScheduleBounds } from './event-sessions';


export function getEventDisplayStatus(event: EventItem, now = Date.now()): EventDisplayStatus {
  if (event.status === 'voting') return 'voting';
  if (event.status === 'Vencido') return 'expired';
  // Con sesiones termina al cerrar la última; sin sesiones, en la fecha y hora de fin.
  const { endsAt } = getScheduleBounds({ ...event, date: event.eventDate });
  if (Number.isFinite(endsAt) && now >= endsAt) return 'finished';
  return calculateEventCapacityStatus(event).isFull ? 'full' : 'published';
}

export function formatVotingDeadline(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-BO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: BOLIVIA_TIME_ZONE,
  }).format(date);
}
