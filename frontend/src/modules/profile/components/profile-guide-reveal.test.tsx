import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuideReveal } from './profile-guide-reveal';

let animations: FakeAnimation[];

beforeEach(() => {
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});
afterEach(() => {
  cleanup();
  restoreAnimationStubs();
});

describe('ProfileGuideReveal', () => {
  it('fades its content in while it rises 12 px', () => {
    render(<ProfileGuideReveal className="mt-2">Bienvenido</ProfileGuideReveal>);

    const [reveal] = animations;
    expect(screen.getByText('Bienvenido')).toHaveClass('mt-2');
    expect(reveal.keyframes).toEqual([
      { transform: 'translateY(12px)', opacity: 0 },
      { transform: 'translateY(0px)', opacity: 1 },
    ]);
    expect(reveal.options).toMatchObject({
      duration: 500,
      delay: 0,
      fill: 'both',
    });
  });

  it('waits for the given delay', () => {
    render(<ProfileGuideReveal delayMs={240}>Bienvenido</ProfileGuideReveal>);

    expect(animations[0].options).toMatchObject({ delay: 240 });
  });

  it('cancels the animation on unmount', () => {
    const { unmount } = render(<ProfileGuideReveal>Bienvenido</ProfileGuideReveal>);
    unmount();

    expect(animations[0].cancel).toHaveBeenCalled();
  });

  it('shows the content right away with reduced motion', () => {
    stubReducedMotion(true);
    render(<ProfileGuideReveal>Bienvenido</ProfileGuideReveal>);

    expect(animations).toHaveLength(0);
    expect(screen.getByText('Bienvenido')).toBeInTheDocument();
  });

  it('shows the content when the browser cannot animate elements', () => {
    removeElementAnimate();
    const { unmount } = render(<ProfileGuideReveal>Bienvenido</ProfileGuideReveal>);

    expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });
});
