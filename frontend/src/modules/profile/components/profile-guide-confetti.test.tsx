import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuideConfetti } from './profile-guide-confetti';

let animations: FakeAnimation[];

beforeEach(() => {
  vi.useFakeTimers();
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restoreAnimationStubs();
});

describe('ProfileGuideConfetti', () => {
  it('renders sixteen decorative pieces that ignore the pointer', () => {
    const { container } = render(<ProfileGuideConfetti className="z-10" />);

    const pieces = container.querySelectorAll('span');
    expect(container.firstElementChild).toHaveClass('z-10');
    expect(pieces).toHaveLength(16);
    pieces.forEach((piece) => {
      expect(piece).toHaveAttribute('aria-hidden', 'true');
      expect(piece).toHaveClass('pointer-events-none', 'opacity-0');
    });
  });

  it('throws every piece with transform and opacity and keeps the end state', () => {
    render(<ProfileGuideConfetti />);

    expect(animations).toHaveLength(16);
    animations.forEach((animation) => {
      expect(animation.options).toMatchObject({
        duration: 1400,
        fill: 'forwards',
      });
      expect(animation.options.delay).toBeGreaterThanOrEqual(350);
      expect(animation.options.delay).toBeLessThanOrEqual(530);
      animation.keyframes.forEach((keyframe) => {
        expect(keyframe).toHaveProperty('transform');
        expect(keyframe).toHaveProperty('opacity');
      });
    });
  });

  it('unmounts the pieces when the animation is over', () => {
    const { container } = render(<ProfileGuideConfetti />);

    act(() => vi.advanceTimersByTime(1929));
    expect(container.querySelectorAll('span')).toHaveLength(16);

    act(() => vi.advanceTimersByTime(1));
    expect(container).toBeEmptyDOMElement();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels the animations and the timer on unmount', () => {
    const { unmount } = render(<ProfileGuideConfetti />);
    unmount();

    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalled(),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('renders nothing with reduced motion', () => {
    stubReducedMotion(true);
    const { container } = render(<ProfileGuideConfetti />);

    expect(container).toBeEmptyDOMElement();
    expect(animations).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the pieces invisible when the browser cannot animate elements', () => {
    removeElementAnimate();
    const { container } = render(<ProfileGuideConfetti />);

    container.querySelectorAll('span').forEach((piece) => {
      expect(piece).toHaveClass('opacity-0');
    });
    act(() => vi.advanceTimersByTime(1930));
    expect(container).toBeEmptyDOMElement();
  });
});
