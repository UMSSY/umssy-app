import type { EventWithRelations } from '../types/events.types.js';

export function rankEventsByPopularity(
  events: EventWithRelations[],
): EventWithRelations[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort(
      (left, right) =>
        right.event._count.registrations - left.event._count.registrations ||
        left.index - right.index,
    )
    .map(({ event }) => event);
}
