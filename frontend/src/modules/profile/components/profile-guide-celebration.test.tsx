import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PROFILE_GUIDE_CELEBRATION_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_JUMP_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuideCelebration } from './profile-guide-celebration';

let animations: FakeAnimation[];

function findAnimation(keyframes: Keyframe[]) {
  return animations.find((animation) => animation.keyframes === keyframes);
}

beforeEach(() => {
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});
afterEach(() => {
  cleanup();
  restoreAnimationStubs();
});

describe('ProfileGuideCelebration', () => {
  it('shows the celebrating mascot with sparkles and confetti', () => {
    const { container } = render(<ProfileGuideCelebration className="mx-auto" />);

    expect(container.firstElementChild).toHaveClass('relative', 'mx-auto');
    expect(
      screen.getByRole('img', { name: 'Asistente virtual UMSSY' }),
    ).toBeInTheDocument();
    expect(container.querySelector('img.opacity-100')).toHaveAttribute(
      'data-frame',
      'celebrate',
    );
    expect(container.querySelectorAll('svg')).toHaveLength(4);
    expect(container.querySelectorAll('span')).toHaveLength(16);
  });

  it('does not render confetti when it is turned off', () => {
    const { container } = render(<ProfileGuideCelebration hasConfetti={false} />);

    expect(container.querySelectorAll('span')).toHaveLength(0);
    expect(container.querySelectorAll('svg')).toHaveLength(4);
  });

  it('pops in with energy and then jumps three times', () => {
    render(<ProfileGuideCelebration />);

    const entrance = findAnimation(PROFILE_GUIDE_CELEBRATION_ENTRANCE_KEYFRAMES);
    const jump = findAnimation(PROFILE_GUIDE_JUMP_KEYFRAMES);
    expect(entrance?.options).toMatchObject({ duration: 800 });
    expect(entrance?.keyframes.map((keyframe) => keyframe.transform)).toEqual([
      'scale(0.6)',
      'scale(1.1)',
      'scale(1)',
    ]);
    expect(jump?.options).toMatchObject({
      duration: 520,
      delay: 800,
      iterations: 3,
    });
    expect(jump?.target).toHaveClass('origin-bottom');
  });

  it('cancels the animations on unmount', () => {
    const { unmount } = render(<ProfileGuideCelebration />);
    unmount();

    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalled(),
    );
  });

  it('shows a static mascot without confetti with reduced motion', () => {
    stubReducedMotion(true);
    const { container } = render(<ProfileGuideCelebration />);

    expect(animations).toHaveLength(0);
    expect(container.querySelectorAll('span')).toHaveLength(0);
    expect(container.querySelector('img.opacity-100')).toHaveAttribute(
      'data-frame',
      'celebrate',
    );
  });

  it('renders when the browser cannot animate elements', () => {
    removeElementAnimate();
    const { unmount } = render(<ProfileGuideCelebration />);

    expect(screen.getByRole('img', { name: /Asistente/ })).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });
});
