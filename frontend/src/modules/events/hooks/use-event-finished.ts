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

  useEffect(() => {
    if (!hasUnfinishedEvent) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasUnfinishedEvent, schedulesKey]);

  return Array.isArray(eventOrEvents) ? finished : (finished[0] ?? false);
}
