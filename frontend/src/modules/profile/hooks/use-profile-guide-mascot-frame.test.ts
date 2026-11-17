import { act, cleanup, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PROFILE_GUIDE_BLINK_INTERVALS_MS,
  PROFILE_GUIDE_TALK_INTERVALS_MS,
  PROFILE_GUIDE_WAVE_SEQUENCE,
} from '../constants/profile-guide-animation.constants';
import {
  restoreAnimationStubs,
  setDocumentVisibility,
} from '../testing/profile-guide-animation.fixture';
import { useProfileGuideMascotFrame } from './use-profile-guide-mascot-frame';

const idle = { isEnabled: true, isTalking: false };

function renderFrame(initialProps = idle) {
  return renderHook((props) => useProfileGuideMascotFrame(props), {
    initialProps,
  });
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restoreAnimationStubs();
});

describe('greeting cycle', () => {
  it('walks the wave sequence three times and ends on wave', () => {
    const { result } = renderFrame();
    act(() => result.current.playGreeting());

    const frames = [result.current.frame];
    for (let step = 1; step < PROFILE_GUIDE_WAVE_SEQUENCE.length * 3; step += 1) {
      advance(160);
      frames.push(result.current.frame);
    }

    expect(frames).toEqual([
      ...PROFILE_GUIDE_WAVE_SEQUENCE,
      ...PROFILE_GUIDE_WAVE_SEQUENCE,
      ...PROFILE_GUIDE_WAVE_SEQUENCE,
    ]);
    expect(result.current.frame).toBe('wave');
  });

  it('does not repeat by itself and does not blink while it runs', () => {
    const { result } = renderFrame();
    advance(3000);
    act(() => result.current.playGreeting());

    advance(400);
    expect(result.current.frame).not.toBe('blink');

    advance(14 * 160 - 400);
    expect(result.current.frame).toBe('wave');

    advance(3199);
    expect(result.current.frame).toBe('wave');
    advance(1);
    expect(result.current.frame).toBe('blink');
  });

  it('is dropped when the mascot starts talking', () => {
    const { result, rerender } = renderFrame();
    act(() => result.current.playGreeting());
    advance(160);
    expect(result.current.frame).toBe('wave-b');

    rerender({ isEnabled: true, isTalking: true });
    rerender(idle);
    expect(result.current.frame).toBe('wave');

    advance(160);
    expect(result.current.frame).toBe('wave');
  });
});

describe('blinking', () => {
  it('blinks for 130 ms following the configured intervals', () => {
    const { result } = renderFrame();

    for (const interval of [
      ...PROFILE_GUIDE_BLINK_INTERVALS_MS,
      PROFILE_GUIDE_BLINK_INTERVALS_MS[0],
    ]) {
      advance(interval - 1);
      expect(result.current.frame).toBe('wave');
      advance(1);
      expect(result.current.frame).toBe('blink');
      advance(130);
      expect(result.current.frame).toBe('wave');
    }
  });
});

describe('talking', () => {
  it('alternates talk and wave following the configured durations', () => {
    const { result } = renderFrame({ isEnabled: true, isTalking: true });
    advance(0);

    const frames = [result.current.frame];
    for (const duration of PROFILE_GUIDE_TALK_INTERVALS_MS) {
      advance(duration);
      frames.push(result.current.frame);
    }

    expect(frames).toEqual([
      'talk',
      'wave',
      'talk',
      'wave',
      'talk',
      'wave',
      'talk',
    ]);
  });

  it('goes back to wave when it stops talking', () => {
    const { result, rerender } = renderFrame({
      isEnabled: true,
      isTalking: true,
    });
    advance(0);
    expect(result.current.frame).toBe('talk');

    rerender(idle);
    expect(result.current.frame).toBe('wave');

    advance(1000);
    expect(result.current.frame).toBe('wave');
  });

  it('does not blink while talking', () => {
    const { result } = renderFrame({ isEnabled: true, isTalking: true });
    const frames = new Set<string>();
    for (let elapsed = 0; elapsed < 6000; elapsed += 10) {
      advance(10);
      frames.add(result.current.frame);
    }

    expect([...frames].sort()).toEqual(['talk', 'wave']);
  });
});

describe('timers', () => {
  it('does nothing while the frames are disabled', () => {
    const { result } = renderFrame({ isEnabled: false, isTalking: true });
    act(() => result.current.playGreeting());

    expect(vi.getTimerCount()).toBe(0);
    advance(10000);
    expect(result.current.frame).toBe('wave');
  });

  it('shows wave as soon as the frames are disabled', () => {
    const { result, rerender } = renderFrame();
    advance(3200);
    expect(result.current.frame).toBe('blink');

    rerender({ isEnabled: false, isTalking: false });
    expect(result.current.frame).toBe('wave');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves no pending timer after unmount', () => {
    const { result, unmount } = renderFrame();
    act(() => result.current.playGreeting());
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses while the document is hidden and resumes when visible', () => {
    const { result } = renderFrame();
    expect(vi.getTimerCount()).toBe(1);

    act(() => setDocumentVisibility('hidden'));
    expect(vi.getTimerCount()).toBe(0);
    advance(10000);
    expect(result.current.frame).toBe('wave');

    act(() => setDocumentVisibility('visible'));
    expect(vi.getTimerCount()).toBe(1);
    advance(3200);
    expect(result.current.frame).toBe('blink');
  });

  it('shows the wave frame while rendering on the server', () => {
    setDocumentVisibility('hidden');
    function Probe() {
      return createElement('span', null, useProfileGuideMascotFrame(idle).frame);
    }

    expect(renderToString(createElement(Probe))).toContain('wave');
  });
});
