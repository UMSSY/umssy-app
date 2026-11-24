import { formatUtcDate } from '../utils/event-date-time.js';
import type { ManagedWorkshopResponse } from '../types/managed-workshop-response.types.js';
import { mapEventSessions } from './event-session.mapper.js';

type ManagedWorkshopRecord = {
  id: string;
  title: string;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  location: string | null;
  coverMimeType: string | null;
  sessions?: { id: string; startsAt: Date; endsAt: Date; location: string | null }[];
};

export function mapManagedWorkshops(events: ManagedWorkshopRecord[]): ManagedWorkshopResponse[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    eventDate: formatUtcDate(event.eventDate),
    startTime: event.startTime.toISOString().slice(11, 23),
    endTime: event.endTime.toISOString().slice(11, 23),
    location: event.location,
    sessions: mapEventSessions(event.sessions),
    ...(event.coverMimeType && { coverUrl: `/events/${event.id}/cover` }),
  }));
}
