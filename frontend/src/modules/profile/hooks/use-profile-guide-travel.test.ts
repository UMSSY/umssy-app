import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import type { ProfileGuideTravelOptions } from '../types/profile-guide-travel-options.types';
import { useProfileGuideTravel } from './use-profile-guide-travel';

let animations: FakeAnimation[];

beforeEach(() => {
  vi.useFakeTimers();
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});

afterEach(() => {
  cleanup();
  restoreAnimationStubs();
  vi.useRealTimers();
});

function setup() {
  const onArrive = vi.fn();
  const initialProps: ProfileGuideTravelOptions = {
    travelKey: 0,
    side: 'left',
    onArrive,
  };
  const hook = renderHook(
    (props: ProfileGuideTravelOptions) => useProfileGuideTravel(props),
    { initialProps },
  );
  const element = document.createElement('div');
  hook.result.current.mascotRef.current = element;
  const measure = vi.spyOn(element, 'getBoundingClientRect');
  function move(
    fromX: number,
    toX: number,
    travelKey: number,
    side: 'left' | 'right',
  ) {
    measure.mockReturnValue(new DOMRect(fromX, 20, 100, 100));
    hook.result.current.captureOrigin();
    measure.mockReturnValue(new DOMRect(toX, 35, 100, 100));
    hook.rerender({ travelKey, side, onArrive });
  }
  return { ...hook, element, measure, onArrive, move };
}

function translate(animation: FakeAnimation, frame: number) {
  const value = String(animation.keyframes[frame].transform);
  const match = /translate3d\(([-\d.]+)px, ([-\d.]+)px, 0\)/.exec(value);
  if (!match) throw new Error(`Translation missing from ${value}`);
  return { x: Number(match[1]), y: Number(match[2]) };
}

describe('useProfileGuideTravel', () => {
  it('does not begin a transition before capture and a travel request', () => {
    const { onArrive } = setup();

    expect(animations).toHaveLength(0);
    expect(onArrive).not.toHaveBeenCalled();
  });

  it('travels from the previous left position and commits arrival only after the animation finishes', () => {
    const { move, element, onArrive } = setup();
    move(10, 350, 1, 'right');

    expect(animations).toHaveLength(1);
    expect(animations[0].target).toBe(element);
    expect(translate(animations[0], 0)).toEqual({ x: -340, y: -15 });
    expect(translate(animations[0], 1).x).toBeGreaterThan(-340);
    expect(translate(animations[0], 1).x).toBeLessThan(0);
    expect(translate(animations[0], 1).y).toBeLessThan(-15);
    expect(translate(animations[0], 2)).toEqual({ x: 0, y: 0 });
    expect(animations[0].options.duration).toBe(220);
    expect(onArrive).not.toHaveBeenCalled();

    act(() => animations[0].finish());
    act(() => vi.advanceTimersByTime(1000));

    expect(onArrive).toHaveBeenCalledTimes(1);
  });

  it('travels back from the right position with the opposite translation', () => {
    const { move, onArrive } = setup();
    move(350, 10, 1, 'left');

    expect(translate(animations[0], 0).x).toBe(340);
    expect(String(animations[0].keyframes[1].transform)).toContain(
      'rotate(-4deg)',
    );
    expect(onArrive).not.toHaveBeenCalled();
    act(() => animations[0].finish());
    expect(onArrive).toHaveBeenCalledTimes(1);
  });

  it('still makes a short arc when both layouts share the same position', () => {
    const { move } = setup();
    move(40, 40, 1, 'right');

    expect(translate(animations[0], 0).x).toBe(0);
    expect(translate(animations[0], 1)).toEqual({ x: 12, y: -17.8 });
    expect(translate(animations[0], 2)).toEqual({ x: 0, y: 0 });
  });

  it('uses a short fallback when an animation never dispatches its finish event', () => {
    const { move, onArrive } = setup();
    move(0, 300, 1, 'right');

    act(() => vi.advanceTimersByTime(259));
    expect(onArrive).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onArrive).toHaveBeenCalledTimes(1);
    act(() => animations[0].finish());
    expect(onArrive).toHaveBeenCalledTimes(1);
  });

  it.each(['reduced motion', 'unsupported animation'])(
    'arrives immediately with %s',
    async (mode) => {
      if (mode === 'reduced motion') stubReducedMotion(true);
      else removeElementAnimate();
      const { move, onArrive } = setup();

      await act(async () => {
        move(0, 300, 1, 'right');
        await Promise.resolve();
      });

      expect(animations).toHaveLength(0);
      expect(onArrive).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('cancels an obsolete transition and commits only the current request', () => {
    const { move, onArrive } = setup();
    move(0, 300, 1, 'right');
    const obsoleteFinish = animations[0].onfinish;
    move(300, 0, 2, 'left');

    expect(animations[0].cancel).toHaveBeenCalled();
    act(() => obsoleteFinish?.());
    expect(onArrive).not.toHaveBeenCalled();
    act(() => animations[1].finish());
    expect(onArrive).toHaveBeenCalledTimes(1);
  });

  it('cancels the animation and fallback without arriving after unmount', () => {
    const { move, unmount, onArrive } = setup();
    move(0, 300, 1, 'right');
    const lateFinish = animations[0].onfinish;
    unmount();
    act(() => {
      lateFinish?.();
      vi.advanceTimersByTime(1000);
    });

    expect(animations[0].cancel).toHaveBeenCalled();
    expect(onArrive).not.toHaveBeenCalled();
  });

  it('does not repeat an already completed travel key when motion preferences change', () => {
    const reduced = stubReducedMotion(false);
    const { move, onArrive } = setup();
    move(0, 300, 1, 'right');
    act(() => animations[0].finish());
    act(() => reduced.setReduced(true));

    expect(onArrive).toHaveBeenCalledTimes(1);
    expect(animations).toHaveLength(1);
  });
});
