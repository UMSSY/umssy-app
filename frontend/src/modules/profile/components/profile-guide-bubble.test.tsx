import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROFILE_GUIDE_BUBBLE_KEYFRAMES } from '../constants/profile-guide-animation.constants';
import {
  removeElementAnimate,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuideBubble } from './profile-guide-bubble';

let animations: FakeAnimation[];

function findAnimations(keyframes: Keyframe[]) {
  return animations.filter((animation) => animation.keyframes === keyframes);
}

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

describe('ProfileGuideBubble', () => {
  it('renders nothing while it is closed', () => {
    const { container } = render(
      <ProfileGuideBubble isOpen={false}>Hola</ProfileGuideBubble>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(animations).toHaveLength(0);
  });

  it('opens from the bottom right corner with a spring', () => {
    render(
      <ProfileGuideBubble isOpen className="w-64">
        Completa tu perfil
      </ProfileGuideBubble>,
    );

    const [open] = findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.open);
    expect(screen.getByText('Completa tu perfil')).toBeInTheDocument();
    expect(open.target).toHaveClass('origin-bottom-right', 'w-64');
    expect(open.target).not.toHaveAttribute('inert');
    expect(open.options).toMatchObject({ duration: 280 });
    expect(open.keyframes).toEqual([
      { transform: 'scale(0.85) translateY(8px)', opacity: 0 },
      { transform: 'scale(1) translateY(0px)', opacity: 1 },
    ]);
  });

  it('closes with the reverse animation and then stops rendering', () => {
    const { container, rerender } = render(
      <ProfileGuideBubble isOpen>Hola</ProfileGuideBubble>,
    );
    rerender(<ProfileGuideBubble isOpen={false}>Hola</ProfileGuideBubble>);

    const [open] = findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.open);
    const [close] = findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.close);
    expect(open.cancel).toHaveBeenCalledTimes(1);
    expect(close.options).toMatchObject({ duration: 180, fill: 'forwards' });
    expect(close.target).toHaveAttribute('inert');
    expect(screen.getByText('Hola')).toBeInTheDocument();

    act(() => close.finish());
    expect(container).toBeEmptyDOMElement();
  });

  it('opens again when it is restored during or after closing', () => {
    const { rerender } = render(
      <ProfileGuideBubble isOpen>Hola</ProfileGuideBubble>,
    );
    rerender(<ProfileGuideBubble isOpen={false}>Hola</ProfileGuideBubble>);
    rerender(<ProfileGuideBubble isOpen>Hola</ProfileGuideBubble>);

    const [close] = findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.close);
    expect(close.cancel).toHaveBeenCalledTimes(1);
    expect(findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.open)).toHaveLength(2);

    rerender(<ProfileGuideBubble isOpen={false}>Hola</ProfileGuideBubble>);
    act(() => findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.close)[1].finish());
    expect(screen.queryByText('Hola')).not.toBeInTheDocument();

    rerender(<ProfileGuideBubble isOpen>Hola</ProfileGuideBubble>);
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.open)).toHaveLength(3);
  });

  it('pops when the pop key changes while it is open', () => {
    const { rerender } = render(
      <ProfileGuideBubble isOpen popKey="a">
        Uno
      </ProfileGuideBubble>,
    );
    expect(findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.pop)).toHaveLength(0);

    rerender(
      <ProfileGuideBubble isOpen popKey="a">
        Uno
      </ProfileGuideBubble>,
    );
    expect(findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.pop)).toHaveLength(0);

    rerender(
      <ProfileGuideBubble isOpen popKey="b">
        Dos
      </ProfileGuideBubble>,
    );
    const [pop] = findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.pop);
    expect(pop.options).toMatchObject({ duration: 220 });
    expect(pop.target).toHaveTextContent('Dos');
  });

  it('does not pop when the pop key changes while it is closed', () => {
    const { rerender } = render(
      <ProfileGuideBubble isOpen={false} popKey="a">
        Uno
      </ProfileGuideBubble>,
    );
    rerender(
      <ProfileGuideBubble isOpen={false} popKey="b">
        Dos
      </ProfileGuideBubble>,
    );

    expect(animations).toHaveLength(0);
  });

  it('cancels its animations on unmount', () => {
    const { rerender, unmount } = render(
      <ProfileGuideBubble isOpen popKey={1}>
        Hola
      </ProfileGuideBubble>,
    );
    rerender(
      <ProfileGuideBubble isOpen popKey={2}>
        Hola
      </ProfileGuideBubble>,
    );
    unmount();

    expect(animations).toHaveLength(2);
    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalled(),
    );
  });

  it('only fades for 150 ms with reduced motion', () => {
    stubReducedMotion(true);
    const { container, rerender } = render(
      <ProfileGuideBubble isOpen popKey="a">
        Hola
      </ProfileGuideBubble>,
    );
    const [fadeIn] = findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.fadeIn);
    expect(fadeIn.options).toMatchObject({ duration: 150 });
    expect(fadeIn.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);

    rerender(
      <ProfileGuideBubble isOpen={false} popKey="b">
        Hola
      </ProfileGuideBubble>,
    );
    const [fadeOut] = findAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.fadeOut);
    expect(fadeOut.options).toMatchObject({ duration: 150 });
    expect(animations).toHaveLength(2);

    act(() => fadeOut.finish());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows and hides without animation when the browser cannot animate', () => {
    removeElementAnimate();
    const { container, rerender } = render(
      <ProfileGuideBubble isOpen>Hola</ProfileGuideBubble>,
    );
    expect(screen.getByText('Hola')).toBeInTheDocument();

    rerender(<ProfileGuideBubble isOpen={false}>Hola</ProfileGuideBubble>);
    act(() => vi.advanceTimersByTime(0));
    expect(container).toBeEmptyDOMElement();
  });

  it('leaves no timer behind when it unmounts while hiding', () => {
    removeElementAnimate();
    const { rerender, unmount } = render(
      <ProfileGuideBubble isOpen>Hola</ProfileGuideBubble>,
    );
    rerender(<ProfileGuideBubble isOpen={false}>Hola</ProfileGuideBubble>);
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
