import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PROFILE_GUIDE_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_RING_PULSE_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import {
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuideWelcomeHero } from './profile-guide-welcome-hero';

let animations: FakeAnimation[];

beforeEach(() => {
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});
afterEach(() => {
  cleanup();
  restoreAnimationStubs();
});

describe('ProfileGuideWelcomeHero', () => {
  it('shows the large waving mascot over the rings', () => {
    const { container } = render(<ProfileGuideWelcomeHero className="bg-interaction" />);

    expect(container.firstElementChild).toHaveClass('relative', 'bg-interaction');
    expect(
      screen.getByRole('img', { name: 'Asistente virtual UMSSY' }),
    ).toHaveClass('size-72');
    expect(container.querySelector('img.opacity-100')).toHaveAttribute(
      'data-frame',
      'wave',
    );
    expect(container.querySelectorAll('span.rounded-full')).toHaveLength(3);
  });

  it('pops the mascot in and pulses the rings', () => {
    render(<ProfileGuideWelcomeHero />);

    expect(
      animations.filter(
        (animation) => animation.keyframes === PROFILE_GUIDE_ENTRANCE_KEYFRAMES,
      ),
    ).toHaveLength(1);
    expect(
      animations.filter(
        (animation) => animation.keyframes === PROFILE_GUIDE_RING_PULSE_KEYFRAMES,
      ),
    ).toHaveLength(3);
  });

  it('stays static with reduced motion', () => {
    stubReducedMotion(true);
    render(<ProfileGuideWelcomeHero />);

    expect(animations).toHaveLength(0);
    expect(screen.getByRole('img', { name: /Asistente/ })).toBeInTheDocument();
  });
});
