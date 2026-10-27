import type { EventDisplayStatus } from '../types/event-display-status.types';
export type { EventDisplayStatus } from '../types/event-display-status.types';
import type { EventItem } from '../types/event-item.types';
import { calculateEventCapacityStatus } from './event-card';


export function getEventDisplayStatus(event: EventItem): EventDisplayStatus {
  if (event.status === 'voting') return 'voting';
  if (event.status === 'Vencido') return 'expired';
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
    timeZone: 'America/La_Paz',
  }).format(date);
}
