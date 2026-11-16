import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  restoreAnimationStubs,
  stubReducedMotion,
} from '../testing/profile-guide-animation.fixture';
import { useCountUp } from './use-count-up';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restoreAnimationStubs();
});

describe('useCountUp', () => {
  it('counts from zero to the target with animation frames', () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => useCountUp(100, { durationMs: 400 }));
    expect(result.current).toBe(0);

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);

    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe(100);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses the default duration when none is given', () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => useCountUp(80));

    act(() => vi.advanceTimersByTime(600));
    expect(result.current).toBeLessThan(80);

    act(() => vi.advanceTimersByTime(700));
    expect(result.current).toBe(80);
  });

  it('returns the target immediately with reduced motion', () => {
    stubReducedMotion(true);
    const { result } = renderHook(() => useCountUp(100));

    expect(result.current).toBe(100);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns the target immediately when it is disabled', () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => useCountUp(64, { isEnabled: false }));

    expect(result.current).toBe(64);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not animate a target of zero', () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => useCountUp(0));

    expect(result.current).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never shows more than a lowered target and counts again', () => {
    stubReducedMotion(false);
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target, { durationMs: 200 }),
      { initialProps: { target: 100 } },
    );
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe(100);

    rerender({ target: 40 });
    expect(result.current).toBe(40);

    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe(40);
  });

  it('cancels the pending frame on unmount', () => {
    stubReducedMotion(false);
    const { unmount } = renderHook(() => useCountUp(100));
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
