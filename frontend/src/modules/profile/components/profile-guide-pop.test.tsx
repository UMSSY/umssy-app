import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuidePop } from './profile-guide-pop';

let animations: FakeAnimation[];

beforeEach(() => {
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});
afterEach(() => {
  cleanup();
  restoreAnimationStubs();
});

describe('ProfileGuidePop', () => {
  it('does not animate when it mounts already active', () => {
    render(
      <ProfileGuidePop isActive className="text-success">
        Listo
      </ProfileGuidePop>,
    );

    expect(animations).toHaveLength(0);
    expect(screen.getByText('Listo')).toHaveClass('inline-flex', 'text-success');
  });

  it('bounces when it becomes active', () => {
    const { rerender } = render(
      <ProfileGuidePop isActive={false}>Listo</ProfileGuidePop>,
    );
    expect(animations).toHaveLength(0);

    rerender(<ProfileGuidePop isActive>Listo</ProfileGuidePop>);

    expect(animations).toHaveLength(1);
    expect(animations[0].options).toMatchObject({ duration: 360 });
    expect(animations[0].keyframes).toEqual([
      { transform: 'scale(0.6)' },
      { transform: 'scale(1.18)' },
      { transform: 'scale(1)' },
    ]);
  });

  it('bounces again every time it is activated', () => {
    const { rerender, unmount } = render(
      <ProfileGuidePop isActive={false}>Listo</ProfileGuidePop>,
    );
    rerender(<ProfileGuidePop isActive>Listo</ProfileGuidePop>);
    rerender(<ProfileGuidePop isActive={false}>Listo</ProfileGuidePop>);
    expect(animations[0].cancel).toHaveBeenCalledTimes(1);

    rerender(<ProfileGuidePop isActive>Listo</ProfileGuidePop>);
    expect(animations).toHaveLength(2);

    unmount();
    expect(animations[1].cancel).toHaveBeenCalled();
  });

  it('does not bounce with reduced motion', () => {
    stubReducedMotion(true);
    const { rerender } = render(
      <ProfileGuidePop isActive={false}>Listo</ProfileGuidePop>,
    );
    rerender(<ProfileGuidePop isActive>Listo</ProfileGuidePop>);

    expect(animations).toHaveLength(0);
  });

  it('renders when the browser cannot animate elements', () => {
    removeElementAnimate();
    const { rerender } = render(
      <ProfileGuidePop isActive={false}>Listo</ProfileGuidePop>,
    );
    rerender(<ProfileGuidePop isActive>Listo</ProfileGuidePop>);

    expect(screen.getByText('Listo')).toBeInTheDocument();
  });
});
