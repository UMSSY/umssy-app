'use client';

import { useEffect, useState } from 'react';
import type { EventItem } from '../types/event-item.types';
import { getRegistrationEventTimestamp } from '../utils/registration-format';

export function useEventTiming(event: {
  date: string;
  startTime?: string;
  endTime: string;
}) {
  const [now, setNow] = useState(Date.now);
  const startsAt = getRegistrationEventTimestamp(event.date, event.startTime ?? '');
  const endsAt = getRegistrationEventTimestamp(event.date, event.endTime);
  const hasValidStart = Number.isFinite(startsAt);
  const hasStarted = hasValidStart && now >= startsAt;
  const isPast = Number.isFinite(endsAt) && now >= endsAt;
  const isInProgress =
    hasValidStart &&
    Number.isFinite(endsAt) &&
    now >= startsAt &&
    now < endsAt;

  useEffect(() => {
    const nextTransition = [startsAt, endsAt]
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp > now)
      .sort((left, right) => left - right)[0];
    if (nextTransition === undefined) return;

    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(2_147_483_647, Math.max(0, nextTransition - Date.now())),
    );
    return () => window.clearTimeout(timer);
  }, [endsAt, now, startsAt]);

  return { isPast, isInProgress, hasValidStart, hasStarted };
}

export function useEventFinished(
  event: Pick<EventItem, 'eventDate' | 'endTime'>,
): boolean {
  return useEventTiming({
    date: event.eventDate,
    endTime: event.endTime,
  }).isPast;
}