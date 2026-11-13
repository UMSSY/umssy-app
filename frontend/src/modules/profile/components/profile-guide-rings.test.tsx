import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PROFILE_GUIDE_RING_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_RING_PULSE_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuideRings } from './profile-guide-rings';

let animations: FakeAnimation[];

beforeEach(() => {
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});
afterEach(() => {
  cleanup();
  restoreAnimationStubs();
});

describe('ProfileGuideRings', () => {
  it('renders three decorative concentric rings', () => {
    const { container } = render(<ProfileGuideRings className="z-0" />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper).toHaveClass('pointer-events-none', 'z-0');
    expect([...wrapper!.children].map((ring) => ring.className)).toEqual([
      expect.stringContaining('size-[55%]'),
      expect.stringContaining('size-[75%]'),
      expect.stringContaining('size-[95%]'),
    ]);
  });

  it('pops every ring in and then pulses them in a staggered loop', () => {
    render(<ProfileGuideRings />);

    const entrances = animations.filter(
      (animation) =>
        animation.keyframes === PROFILE_GUIDE_RING_ENTRANCE_KEYFRAMES,
    );
    const pulses = animations.filter(
      (animation) => animation.keyframes === PROFILE_GUIDE_RING_PULSE_KEYFRAMES,
    );
    expect(entrances).toHaveLength(3);
    expect(pulses.map((pulse) => pulse.options.delay)).toEqual([
      600, 1200, 1800,
    ]);
    pulses.forEach((pulse) => {
      expect(pulse.options).toMatchObject({
        duration: 2400,
        direction: 'alternate',
        iterations: Infinity,
      });
    });
    animations.forEach((animation) =>
      animation.keyframes.forEach((keyframe) =>
        expect(Object.keys(keyframe).sort()).toEqual(['opacity', 'transform']),
      ),
    );
  });

  it('cancels the animations on unmount', () => {
    const { unmount } = render(<ProfileGuideRings />);
    unmount();

    expect(animations).toHaveLength(6);
    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalled(),
    );
  });

  it('stays static with reduced motion', () => {
    stubReducedMotion(true);
    const { container } = render(<ProfileGuideRings />);

    expect(animations).toHaveLength(0);
    expect(container.querySelectorAll('span')).toHaveLength(3);
  });

  it('stays static when the browser cannot animate elements', () => {
    removeElementAnimate();
    const { container, unmount } = render(<ProfileGuideRings />);

    expect(container.querySelectorAll('span')).toHaveLength(3);
    expect(() => unmount()).not.toThrow();
  });
});
