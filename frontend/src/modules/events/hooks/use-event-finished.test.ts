import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  useEventFinished,
  useEventScheduleStatus,
} from './use-event-finished';

const event = {
  eventDate: '2026-10-20T00:00:00.000Z',
  endTime: '1970-01-01T23:59:00.000Z',
};

describe('useEventFinished', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the Bolivia date and crosses into the next UTC day at closing time', async () => {
    vi.useFakeTimers({
      now: new Date('2026-10-21T03:58:59.999Z'),
      toFake: ['Date', 'setTimeout', 'clearTimeout'],
    });

    const { result } = renderHook(() => useEventFinished([event]));

    expect(result.current).toEqual([false]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current).toEqual([true]);
  });

  it('updates the pass state from confirmed to in progress at Bolivia start time', async () => {
    vi.useFakeTimers({
      now: new Date('2026-10-20T12:59:59.999Z'),
      toFake: ['Date', 'setTimeout', 'clearTimeout'],
    });

    const { result } = renderHook(() =>
      useEventScheduleStatus({
        eventDate: '2026-10-20T00:00:00.000Z',
        startTime: '1970-01-01T09:00:00.000Z',
        endTime: '1970-01-01T12:00:00.000Z',
      }),
    );

    expect(result.current).toEqual({
      isFinished: false,
      isInProgress: false,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current).toEqual({
      isFinished: false,
      isInProgress: true,
    });
  });
});
