'use client';

import { useEffect, useState } from 'react';
import type { EventItem } from '../types/event-item.types';
import { getEventEndTimestamp } from '../utils/event-end-timestamp';

export function useEventFinished(event: Pick<EventItem, 'eventDate' | 'endTime'>): boolean {
  const [now, setNow] = useState(Date.now);
  const endsAt = getEventEndTimestamp(event.eventDate, event.endTime);
  const finished = Number.isFinite(endsAt) && now >= endsAt;
  useEffect(() => {
    if (!Number.isFinite(endsAt) || finished) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, finished]);
  return finished;
}
