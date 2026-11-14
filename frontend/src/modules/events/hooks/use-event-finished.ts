'use client';

import { useEffect, useState } from 'react';
import type { EventItem } from '../types/event-item.types';
import { formatRegistrationTime } from '../utils/registration-format';

type EventSchedule = Pick<EventItem, 'eventDate' | 'endTime'>;

export function useEventFinished(event: EventSchedule): boolean;
export function useEventFinished(events: EventSchedule[]): boolean[];
export function useEventFinished(
  eventOrEvents: EventSchedule | EventSchedule[],
): boolean | boolean[] {
  const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];
  const [now, setNow] = useState(Date.now);
  // Event clocks are stored as local Bolivia times, independently of the browser timezone.
  const endTimes = events.map((event) =>
    Date.parse(
      `${event.eventDate.split('T')[0]}T${formatRegistrationTime(event.endTime)}:00-04:00`,
    ),
  );
  const schedulesKey = endTimes.join(',');
  const finished = endTimes.map(
    (endsAt) => Number.isFinite(endsAt) && now >= endsAt,
  );
  const hasUnfinishedEvent = endTimes.some(
    (endsAt) => Number.isFinite(endsAt) && now < endsAt,
  );
  const nextEndAt = endTimes
    .filter((endsAt) => Number.isFinite(endsAt) && now < endsAt)
    .reduce<number | null>(
      (earliest, endsAt) =>
        earliest === null ? endsAt : Math.min(earliest, endsAt),
      null,
    );

  useEffect(() => {
    if (!hasUnfinishedEvent || nextEndAt === null) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(nextEndAt - Date.now(), 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [hasUnfinishedEvent, nextEndAt, schedulesKey]);

  return Array.isArray(eventOrEvents) ? finished : (finished[0] ?? false);
}
