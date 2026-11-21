import type { EventSessionResponse } from '../types/event-session-response.types.js';

export function mapEventSessions(
  sessions: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    location: string | null;
  }[] = [],
): EventSessionResponse[] {
  return sessions.map((session) => ({
    id: session.id,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    location: session.location,
  }));
}
