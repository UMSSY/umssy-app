'use client';

import { useEffect, useState } from 'react';
import type { EventItem } from '../types/event-item.types';
import { formatRegistrationTime } from '../utils/registration-format';

export function useEventFinished(event: Pick<EventItem, 'eventDate' | 'endTime'>): boolean {
  const [now, setNow] = useState(Date.now);
  // Event clocks are stored as local Bolivia times, independently of the browser timezone.
  const endsAt = Date.parse(`${event.eventDate.split('T')[0]}T${formatRegistrationTime(event.endTime)}:00-04:00`);
  const finished = Number.isFinite(endsAt) && now >= endsAt;
  useEffect(() => {
    if (!Number.isFinite(endsAt) || finished) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, finished]);
  return finished;
}
