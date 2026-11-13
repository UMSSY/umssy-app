import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PROFILE_GUIDE_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_JUMP_KEYFRAMES,
  PROFILE_GUIDE_SWAY_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import {
  getTransforms,
  removeElementAnimate,
  restoreAnimationStubs,
  setDocumentVisibility,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuideMascot } from './profile-guide-mascot';

let animations: FakeAnimation[];

function getFrames() {
  return [...document.querySelectorAll('img')].map(
    (image) => image.dataset.frame,
  );
}

function getActiveFrames() {
  return [...document.querySelectorAll('img.opacity-100')].map(
    (image) => (image as HTMLImageElement).dataset.frame,
  );
}

function findAnimations(keyframes: Keyframe[]) {
  return animations.filter((animation) => animation.keyframes === keyframes);
}

function findStepAnimations() {
  return animations.filter((animation) =>
    getTransforms(animation).some((transform) =>
      transform.includes('translateX'),
    ),
  );
}

function findFloatAnimations() {
  return animations.filter(
    (animation) =>
      animation.keyframes.length === 2 &&
      getTransforms(animation)[0] === 'translateY(0px)',
  );
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

beforeEach(() => {
  vi.useFakeTimers();
  stubReducedMotion(false);
  ({ animations } = stubElementAnimate());
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  restoreAnimationStubs();
});

describe('structure', () => {
  it('exposes the mascot as a labelled image with decorative frames', () => {
    render(<ProfileGuideMascot pose="wave" className="hover:scale-105" />);

    const mascot = screen.getByRole('img', { name: 'Asistente virtual UMSSY' });
    expect(mascot).toHaveClass('size-32', 'hover:scale-105');
    document.querySelectorAll('img').forEach((image) => {
      expect(image).toHaveAttribute('alt', '');
      expect(image).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it.each([
    ['sm', 'size-12'],
    ['md', 'size-32'],
    ['lg', 'size-72'],
  ] as const)('uses a fixed box for size %s', (size, className) => {
    render(<ProfileGuideMascot pose="point" size={size} />);

    expect(screen.getByRole('img', { name: /Asistente/ })).toHaveClass(
      className,
    );
  });

  it('mounts the wave group and keeps a single frame visible', () => {
    render(<ProfileGuideMascot pose="wave" />);

    expect(getFrames()).toEqual(['wave', 'wave-b', 'wave-low', 'blink', 'talk']);
    expect(getActiveFrames()).toEqual(['wave']);
  });

  it('mounts only the main frame with the small size', () => {
    render(<ProfileGuideMascot pose="wave" size="sm" isTalking />);

    expect(getFrames()).toEqual(['wave']);
    advance(10000);
    expect(getActiveFrames()).toEqual(['wave']);
  });

  it('mounts the fly frame only when a step key is given', () => {
    const { rerender } = render(<ProfileGuideMascot pose="point" />);
    expect(getFrames()).toEqual(['point']);

    rerender(<ProfileGuideMascot pose="point" stepKey={0} />);
    expect(getFrames()).toEqual(['point', 'fly']);
  });

  it('mounts the celebrate frame only when a celebration key is given', () => {
    render(<ProfileGuideMascot pose="point" celebrationKey="a" />);

    expect(getFrames()).toEqual(['point', 'celebrate']);
    expect(getActiveFrames()).toEqual(['point']);
  });

  it('preloads only the resting frame when it has priority', () => {
    render(<ProfileGuideMascot pose="wave" priority />);

    const [wave, waveB] = document.querySelectorAll('img');
    expect(wave).not.toHaveAttribute('loading', 'lazy');
    expect(wave).not.toHaveAttribute('loading', 'eager');
    expect(waveB).toHaveAttribute('loading', 'eager');
  });
});

describe('entrance, float and sway', () => {
  it('does not play an entrance by default', () => {
    render(<ProfileGuideMascot pose="wave" />);

    expect(findAnimations(PROFILE_GUIDE_ENTRANCE_KEYFRAMES)).toHaveLength(0);
  });

  it('pops in with transform and opacity and then waves three times', () => {
    render(<ProfileGuideMascot pose="wave" entrance="pop" />);

    const [entrance] = findAnimations(PROFILE_GUIDE_ENTRANCE_KEYFRAMES);
    expect(entrance.options).toMatchObject({ duration: 700 });
    entrance.keyframes.forEach((keyframe) => {
      expect(Object.keys(keyframe)).toEqual(
        expect.arrayContaining(['transform', 'opacity']),
      );
    });
    expect(findFloatAnimations()[0].options).toMatchObject({ delay: 700 });

    act(() => entrance.finish());
    const seen: (string | undefined)[] = [];
    for (let step = 0; step < 14; step += 1) {
      advance(160);
      seen.push(...getActiveFrames());
    }
    expect(seen.filter((frame) => frame === 'wave-low')).toHaveLength(3);
    expect(getActiveFrames()).toEqual(['wave']);
  });

  it('floats in a loop by default and less with the small size', () => {
    const { unmount } = render(<ProfileGuideMascot pose="point" />);
    const [float] = findFloatAnimations();
    expect(getTransforms(float)).toEqual([
      'translateY(0px)',
      'translateY(-6px)',
    ]);
    expect(float.options).toMatchObject({
      delay: 0,
      direction: 'alternate',
      iterations: Infinity,
    });
    unmount();

    render(<ProfileGuideMascot pose="point" size="sm" />);
    expect(getTransforms(findFloatAnimations()[1])[1]).toBe('translateY(-3px)');
  });

  it('does not float when floating is disabled', () => {
    render(<ProfileGuideMascot pose="point" isFloating={false} />);

    expect(animations).toHaveLength(0);
  });

  it('sways only while the wave pose is visible', () => {
    const { rerender } = render(
      <ProfileGuideMascot pose="wave" isFloating={false} />,
    );
    const [sway] = findAnimations(PROFILE_GUIDE_SWAY_KEYFRAMES);
    expect(sway.target).toHaveClass('origin-[50%_90%]');

    rerender(<ProfileGuideMascot pose="point" isFloating={false} />);
    expect(sway.cancel).toHaveBeenCalledTimes(1);
    expect(findAnimations(PROFILE_GUIDE_SWAY_KEYFRAMES)).toHaveLength(1);
  });

  it('cancels every animation and timer on unmount', () => {
    const { unmount } = render(
      <ProfileGuideMascot pose="wave" entrance="pop" stepKey={1} />,
    );
    expect(animations).toHaveLength(3);

    unmount();

    animations.forEach((animation) =>
      expect(animation.cancel).toHaveBeenCalled(),
    );
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('frames', () => {
  it('moves the mouth while talking and stops when told', () => {
    const { rerender } = render(<ProfileGuideMascot pose="wave" isTalking />);
    advance(0);
    expect(getActiveFrames()).toEqual(['talk']);
    advance(180);
    expect(getActiveFrames()).toEqual(['wave']);

    rerender(<ProfileGuideMascot pose="wave" />);
    advance(1000);
    expect(getActiveFrames()).toEqual(['wave']);
  });

  it('ignores talking with another resting pose', () => {
    render(<ProfileGuideMascot pose="point" isTalking />);
    advance(5000);

    expect(getActiveFrames()).toEqual(['point']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('blinks and cuts between frames without a transition', () => {
    render(<ProfileGuideMascot pose="wave" />);
    advance(3200);

    expect(getActiveFrames()).toEqual(['blink']);
    document.querySelectorAll('img').forEach((image) => {
      expect(image).toHaveClass('transition-none');
    });
  });

  it('pauses the frames while the document is hidden', () => {
    render(<ProfileGuideMascot pose="wave" />);
    act(() => setDocumentVisibility('hidden'));

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('pose changes', () => {
  it('crossfades to the new pose and unmounts the previous one', () => {
    const { rerender } = render(<ProfileGuideMascot pose="wave" />);
    rerender(<ProfileGuideMascot pose="point" />);

    expect(getFrames()).toEqual(['wave', 'point']);
    expect(getActiveFrames()).toEqual(['point']);
    document.querySelectorAll('img').forEach((image) => {
      expect(image).toHaveClass('transition-opacity', 'duration-220');
    });

    advance(260);
    expect(getFrames()).toEqual(['point']);
    expect(document.querySelector('img')).toHaveClass('transition-none');
  });
});

describe('step transition', () => {
  it('does not run on mount or when the step key stays the same', () => {
    const { rerender } = render(<ProfileGuideMascot pose="point" stepKey={1} />);
    rerender(<ProfileGuideMascot pose="point" stepKey={1} isTalking />);

    expect(findStepAnimations()).toHaveLength(0);
    expect(getActiveFrames()).toEqual(['point']);
  });

  it('flies to the right and lands on the resting pose going forward', () => {
    const { rerender } = render(<ProfileGuideMascot pose="point" stepKey={1} />);
    rerender(<ProfileGuideMascot pose="point" stepKey={2} />);

    const [step] = findStepAnimations();
    expect(getTransforms(step)[1]).toContain('translateX(28px)');
    expect(step.options).toMatchObject({ duration: 650 });
    expect(getActiveFrames()).toEqual(['fly']);
    expect(document.querySelector('[data-frame="fly"]')).not.toHaveClass(
      '-scale-x-100',
    );

    advance(380);
    expect(getActiveFrames()).toEqual(['point']);

    advance(270);
    expect(vi.getTimerCount()).toBe(0);
    expect(getActiveFrames()).toEqual(['point']);
  });

  it('flies to the left with the fly frame mirrored going backward', () => {
    const { rerender } = render(<ProfileGuideMascot pose="point" stepKey={2} />);
    rerender(
      <ProfileGuideMascot pose="point" stepKey={1} stepDirection="backward" />,
    );

    expect(getTransforms(findStepAnimations()[0])[1]).toContain(
      'translateX(-28px)',
    );
    expect(document.querySelector('[data-frame="fly"]')).toHaveClass(
      '-scale-x-100',
      'opacity-100',
    );
  });

  it('restarts from the current position when the key changes again', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transform: 'matrix(1, 0, 0, 1, 14, 0)',
    } as CSSStyleDeclaration);
    const { rerender } = render(<ProfileGuideMascot pose="point" stepKey={1} />);
    rerender(<ProfileGuideMascot pose="point" stepKey={2} />);
    advance(200);
    rerender(<ProfileGuideMascot pose="point" stepKey={3} />);

    const [first, second] = findStepAnimations();
    expect(first.cancel).toHaveBeenCalledTimes(1);
    expect(getTransforms(second)[0]).toBe('matrix(1, 0, 0, 1, 14, 0)');
    expect(getActiveFrames()).toEqual(['fly']);

    advance(380);
    expect(getActiveFrames()).toEqual(['point']);
    advance(270);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('only changes the pose with reduced motion', () => {
    stubReducedMotion(true);
    const { rerender } = render(<ProfileGuideMascot pose="point" stepKey={1} />);
    rerender(<ProfileGuideMascot pose="point" stepKey={2} />);

    expect(animations).toHaveLength(0);
    expect(getActiveFrames()).toEqual(['fly']);

    advance(380);
    expect(getActiveFrames()).toEqual(['point']);
  });
});

describe('brief celebration', () => {
  it('does not run on mount', () => {
    render(<ProfileGuideMascot pose="point" celebrationKey={1} />);

    expect(findAnimations(PROFILE_GUIDE_JUMP_KEYFRAMES)).toHaveLength(0);
    expect(getActiveFrames()).toEqual(['point']);
  });

  it('shows the celebrate pose with one jump and returns after 1300 ms', () => {
    const { rerender } = render(
      <ProfileGuideMascot pose="point" celebrationKey={1} />,
    );
    rerender(<ProfileGuideMascot pose="point" celebrationKey={2} />);

    const [jump] = findAnimations(PROFILE_GUIDE_JUMP_KEYFRAMES);
    expect(jump.options).toMatchObject({ duration: 520, delay: 220 });
    expect(getActiveFrames()).toEqual(['celebrate']);

    advance(1299);
    expect(getActiveFrames()).toEqual(['celebrate']);
    advance(1);
    expect(getActiveFrames()).toEqual(['point']);
  });

  it('keeps the pose change without jumping with reduced motion', () => {
    stubReducedMotion(true);
    const { rerender } = render(
      <ProfileGuideMascot pose="point" celebrationKey={1} />,
    );
    rerender(<ProfileGuideMascot pose="point" celebrationKey={2} />);

    expect(animations).toHaveLength(0);
    expect(getActiveFrames()).toEqual(['celebrate']);

    advance(1300);
    expect(getActiveFrames()).toEqual(['point']);
  });

  it('runs before a step transition requested at the same time', () => {
    const { rerender } = render(
      <ProfileGuideMascot pose="point" stepKey={1} celebrationKey={1} />,
    );
    rerender(<ProfileGuideMascot pose="point" stepKey={2} celebrationKey={2} />);

    expect(getActiveFrames()).toEqual(['celebrate']);
    expect(findStepAnimations()).toHaveLength(0);

    advance(1300);
    expect(getActiveFrames()).toEqual(['fly']);
    expect(findStepAnimations()).toHaveLength(1);

    advance(650);
    expect(getActiveFrames()).toEqual(['point']);
  });

  it('queues a celebration requested during a step transition', () => {
    const { rerender } = render(
      <ProfileGuideMascot pose="point" stepKey={1} celebrationKey={1} />,
    );
    rerender(<ProfileGuideMascot pose="point" stepKey={2} celebrationKey={1} />);
    advance(100);
    rerender(<ProfileGuideMascot pose="point" stepKey={2} celebrationKey={2} />);
    expect(getActiveFrames()).toEqual(['fly']);

    advance(550);
    expect(getActiveFrames()).toEqual(['celebrate']);
  });
});

describe('without animation support', () => {
  it('stays static with reduced motion', () => {
    stubReducedMotion(true);
    render(<ProfileGuideMascot pose="wave" entrance="pop" isTalking />);

    expect(animations).toHaveLength(0);
    expect(getFrames()).toEqual(['wave']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('renders the pose when the browser cannot animate elements', () => {
    removeElementAnimate();
    render(<ProfileGuideMascot pose="celebrate" entrance="pop" />);

    expect(getActiveFrames()).toEqual(['celebrate']);
  });
});
