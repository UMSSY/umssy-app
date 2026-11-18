import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuideSparkles } from './profile-guide-sparkles';

let animations: FakeAnimation[];

beforeEach(() => {
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});
afterEach(() => {
  cleanup();
  restoreAnimationStubs();
});

describe('ProfileGuideSparkles', () => {
  it('renders four decorative inline SVG stars', () => {
    const { container } = render(<ProfileGuideSparkles className="z-10" />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper).toHaveClass('pointer-events-none', 'z-10');
    expect(container.querySelectorAll('svg path')).toHaveLength(4);
    expect(wrapper).toHaveTextContent('');
  });

  it('twinkles every star in a staggered loop', () => {
    render(<ProfileGuideSparkles />);

    expect(animations.map((animation) => animation.options.delay)).toEqual([
      0, 300, 600, 900,
    ]);
    animations.forEach((animation) => {
      expect(animation.options).toMatchObject({
        duration: 1800,
        direction: 'alternate',
        iterations: Infinity,
      });
      expect(animation.keyframes).toEqual([
        { transform: 'scale(0.6) rotate(0deg)', opacity: 0.2 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1 },
      ]);
    });
  });

  it('cancels the animations on unmount', () => {
    const { unmount } = render(<ProfileGuideSparkles />);
    unmount();

    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalled(),
    );
  });

  it('stays static with reduced motion', () => {
    stubReducedMotion(true);
    const { container } = render(<ProfileGuideSparkles />);

    expect(animations).toHaveLength(0);
    expect(container.querySelectorAll('svg')).toHaveLength(4);
  });

  it('stays static when the browser cannot animate elements', () => {
    removeElementAnimate();
    const { container, unmount } = render(<ProfileGuideSparkles />);

    expect(container.querySelectorAll('svg')).toHaveLength(4);
    expect(() => unmount()).not.toThrow();
  });
});
