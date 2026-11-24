'use client';

import { useEffect, useState } from 'react';
import type { EventItem } from '../types/event-item.types';
import { getScheduleBounds } from '../utils/event-sessions';
import type { EventSession } from '../types/event-session.types';

export function useEventTiming(event: {
  date: string;
  startTime?: string;
  endTime: string;
  sessions?: EventSession[];
}) {
  const [now, setNow] = useState(Date.now);
  // Con sesiones, el taller empieza en la primera y termina al cerrar la última.
  const { startsAt, endsAt } = getScheduleBounds(event);
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