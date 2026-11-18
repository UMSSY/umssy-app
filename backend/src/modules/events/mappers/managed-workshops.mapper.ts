import { formatUtcDate } from '../utils/event-date-time.js';
import type { ManagedWorkshopResponse } from '../types/managed-workshop-response.types.js';

type ManagedWorkshopRecord = {
  id: string;
  title: string;
  eventDate: Date;
  startTime: Date;
  endTime: Date;
  location: string | null;
  coverMimeType: string | null;
};

export function mapManagedWorkshops(events: ManagedWorkshopRecord[]): ManagedWorkshopResponse[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    eventDate: formatUtcDate(event.eventDate),
    startTime: event.startTime.toISOString().slice(11, 23),
    endTime: event.endTime.toISOString().slice(11, 23),
    location: event.location,
    ...(event.coverMimeType && { coverUrl: `/events/${event.id}/cover` }),
  }));
}
