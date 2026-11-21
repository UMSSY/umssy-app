import { POPULARITY_WEIGHT } from '../constants/event-affinity.constants.js';
import type { AffinitySignals } from '../types/affinity-signals.types.js';
import type { EventWithRelations } from '../types/events.types.js';
import type { RankedEvent } from '../types/ranked-event.types.js';
import { scoreEventAffinity } from './score-event-affinity.js';

export function rankEventsByAffinity(
  events: EventWithRelations[],
  signals: AffinitySignals,
): RankedEvent[] {
  const maxRegistrations = Math.max(
    0,
    ...events.map((event) => event._count.registrations),
  );

  return events
    .map((event, index) => {
      const { affinity, reasons } = scoreEventAffinity(event, signals);
      const popularity = maxRegistrations
        ? event._count.registrations / maxRegistrations
        : 0;
      return {
        index,
        affinity,
        total: affinity + popularity * POPULARITY_WEIGHT,
        ranked: {
          event,
          recommendation: {
            score: Math.round((affinity + popularity * POPULARITY_WEIGHT) * 100),
            reasons,
          },
        },
      };
    })
    .sort(
      (left, right) =>
        Number(right.affinity > 0) - Number(left.affinity > 0) ||
        right.total - left.total ||
        right.ranked.event._count.registrations -
          left.ranked.event._count.registrations ||
        left.index - right.index,
    )
    .map(({ ranked }) => ranked);
}
