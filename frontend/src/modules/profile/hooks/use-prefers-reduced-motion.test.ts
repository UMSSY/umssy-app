import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  removeMatchMedia,
  restoreAnimationStubs,
  stubReducedMotion,
} from '../testing/profile-guide-animation.fixture';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

afterEach(() => {
  cleanup();
  restoreAnimationStubs();
});

describe('usePrefersReducedMotion', () => {
  it('returns false when matchMedia is not available', () => {
    removeMatchMedia();
    const { result, unmount } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    expect(() => unmount()).not.toThrow();
  });

  it('returns false when the user has no motion preference', () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when the user prefers reduced motion', () => {
    stubReducedMotion(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('reacts to preference changes and unsubscribes on unmount', () => {
    const media = stubReducedMotion(false);
    const { result, unmount } = renderHook(() => usePrefersReducedMotion());
    expect(media.listeners.size).toBe(1);

    act(() => media.setReduced(true));
    expect(result.current).toBe(true);

    unmount();
    expect(media.listeners.size).toBe(0);
  });
});
