"use client";

import { useEffect, useState } from 'react';
import type { Registration } from '@/modules/registrations';
import { getEventEndTimestamp } from '../utils/event-end-timestamp';
import { MAX_PASS_TIMER_DELAY_MS } from '../constants/passes.constants';

export function useActivePasses(registrations: Registration[]) {
  const [now, setNow] = useState(Date.now);
  const active = registrations.filter(pass => getEventEndTimestamp(pass.date, pass.endTime) > now);
  const nextEnd = active.length ? Math.min(...active.map(pass => getEventEndTimestamp(pass.date, pass.endTime))) : null;

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = nextEnd === null ? undefined : window.setTimeout(refresh, Math.min(MAX_PASS_TIMER_DELAY_MS, Math.max(0, nextEnd - Date.now())));
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [nextEnd, now]);

  return active;
}
