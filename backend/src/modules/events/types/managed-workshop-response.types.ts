import type { EventSessionResponse } from './event-session-response.types.js';

export interface ManagedWorkshopResponse {
  id: string;
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  sessions: EventSessionResponse[];
  coverUrl?: string;
}
