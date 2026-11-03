import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Registration } from '@/modules/registrations';
import { useActivePasses } from './use-active-passes';

const pass: Registration = { id: 'reg-1', eventName: 'Workshop', date: '2026-12-01', startTime: '09:00', endTime: '12:00', location: 'Aula 1', status: 'Confirmada' };
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('active passes after returning to the app', () => {
  it.each(['focus', 'visibilitychange'])('rechecks the clock on %s without fetching or changing the stored pass', event => {
    vi.useFakeTimers({ now: new Date('2026-12-01T15:59:59Z') });
    const { result } = renderHook(() => useActivePasses([pass]));
    expect(result.current).toEqual([pass]);
    vi.setSystemTime(new Date('2026-12-01T16:01:00Z'));
    act(() => { (event === 'focus' ? window : document).dispatchEvent(new Event(event)); });
    expect(result.current).toEqual([]);
    expect(pass.id).toBe('reg-1');
  });
});
