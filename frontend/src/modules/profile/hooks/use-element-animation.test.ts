import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
} from '../testing/profile-guide-animation.fixture';
import { useElementAnimation } from './use-element-animation';

const keyframes = [
  { transform: 'scale(0.6)', opacity: 0 },
  { transform: 'scale(1)', opacity: 1 },
];
const options = { duration: 100 };

afterEach(() => {
  cleanup();
  restoreAnimationStubs();
});

describe('useElementAnimation', () => {
  it('animates the element with transform and opacity keyframes', () => {
    stubReducedMotion(false);
    const { animate } = stubElementAnimate();
    const element = document.createElement('div');
    const { result } = renderHook(() => useElementAnimation());

    const animation = result.current.animate(element, keyframes, options);

    expect(animation).not.toBeNull();
    expect(result.current.isReducedMotion).toBe(false);
    expect(animate).toHaveBeenCalledWith(keyframes, options);
  });

  it('returns null when the user prefers reduced motion', () => {
    stubReducedMotion(true);
    const { animate } = stubElementAnimate();
    const { result } = renderHook(() => useElementAnimation());

    expect(
      result.current.animate(document.createElement('div'), keyframes, options),
    ).toBeNull();
    expect(result.current.isReducedMotion).toBe(true);
    expect(animate).not.toHaveBeenCalled();
  });

  it('returns null when the browser cannot animate elements', () => {
    stubReducedMotion(false);
    removeElementAnimate();
    const { result } = renderHook(() => useElementAnimation());

    expect(
      result.current.animate(document.createElement('div'), keyframes, options),
    ).toBeNull();
  });

  it('returns null when there is no element', () => {
    stubReducedMotion(false);
    stubElementAnimate();
    const { result } = renderHook(() => useElementAnimation());

    expect(result.current.animate(null, keyframes, options)).toBeNull();
  });

  it('cancels the active animations on unmount', () => {
    stubReducedMotion(false);
    const { animations } = stubElementAnimate();
    const element = document.createElement('div');
    const { result, unmount } = renderHook(() => useElementAnimation());
    result.current.animate(element, keyframes, options);
    result.current.animate(element, keyframes, options);

    unmount();

    expect(animations).toHaveLength(2);
    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalledTimes(1),
    );
  });

  it('stops tracking animations that already ended', () => {
    stubReducedMotion(false);
    const { animations } = stubElementAnimate();
    const element = document.createElement('div');
    const { result, unmount } = renderHook(() => useElementAnimation());
    result.current.animate(element, keyframes, options);
    result.current.animate(element, keyframes, options);
    result.current.animate(element, keyframes, options);
    animations[0].playState = 'finished';
    animations[1].playState = 'idle';
    animations[2].playState = 'running';
    result.current.animate(element, keyframes, options);

    unmount();

    expect(animations[0].cancel).not.toHaveBeenCalled();
    expect(animations[1].cancel).not.toHaveBeenCalled();
    expect(animations[2].cancel).toHaveBeenCalledTimes(1);
    expect(animations[3].cancel).toHaveBeenCalledTimes(1);
  });
});
