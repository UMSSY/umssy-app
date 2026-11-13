import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PROFILE_GUIDE_BUBBLE_KEYFRAMES,
  PROFILE_GUIDE_CELEBRATION_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_JUMP_KEYFRAMES,
  PROFILE_GUIDE_POP_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import {
  getTransforms,
  restoreAnimationStubs,
  stubElementAnimate,
  stubReducedMotion,
  type FakeAnimation,
} from '../testing/profile-guide-animation.fixture';
import { ProfileGuidePreviewView } from './profile-guide-preview-view';

let animations: FakeAnimation[];

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

function countAnimations(keyframes: Keyframe[]) {
  return animations.filter((animation) => animation.keyframes === keyframes)
    .length;
}

function getStepTransforms() {
  return animations
    .map((animation) => getTransforms(animation)[1])
    .filter((transform) => transform.includes('translateX'));
}

/** The second mascot on the page is the one driven by the pose buttons. */
function getPlaygroundFrame() {
  const mascot = screen.getAllByRole('img', {
    name: 'Asistente virtual UMSSY',
  })[1];
  return mascot.querySelector<HTMLImageElement>('img.opacity-100')?.dataset
    .frame;
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

describe('ProfileGuidePreviewView', () => {
  it('shows the four moments of the guide', () => {
    render(<ProfileGuidePreviewView />);

    [
      '1. Modal de bienvenida',
      '2. Poses, transición de paso y celebración breve',
      '3. Celebración al 100%',
      '4. Widget con globo',
    ].forEach((name) =>
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument(),
    );
    expect(screen.getByText('Te damos la bienvenida')).toBeInTheDocument();
  });

  it('replays the welcome entrance', () => {
    render(<ProfileGuidePreviewView />);
    click('Repetir bienvenida');

    expect(countAnimations(PROFILE_GUIDE_ENTRANCE_KEYFRAMES)).toBe(2);
  });

  it('switches the resting pose', () => {
    render(<ProfileGuidePreviewView />);
    expect(getPlaygroundFrame()).toBe('point');
    expect(screen.getByRole('button', { name: 'Señalar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    click('Festejar');
    expect(getPlaygroundFrame()).toBe('celebrate');

    click('Saludar');
    expect(getPlaygroundFrame()).toBe('wave');
  });

  it('runs the step transition forward and backward', () => {
    render(<ProfileGuidePreviewView />);

    click('Paso siguiente');
    expect(getPlaygroundFrame()).toBe('fly');
    act(() => vi.advanceTimersByTime(650));

    click('Paso anterior');
    expect(getStepTransforms()).toEqual([
      expect.stringContaining('translateX(28px)'),
      expect.stringContaining('translateX(-28px)'),
    ]);
  });

  it('runs the brief celebration', () => {
    render(<ProfileGuidePreviewView />);
    const jumps = countAnimations(PROFILE_GUIDE_JUMP_KEYFRAMES);

    click('Celebración breve');

    expect(getPlaygroundFrame()).toBe('celebrate');
    expect(countAnimations(PROFILE_GUIDE_JUMP_KEYFRAMES)).toBe(jumps + 1);
    act(() => vi.advanceTimersByTime(1300));
    expect(getPlaygroundFrame()).toBe('point');
  });

  it('makes the mascot talk while waving', () => {
    render(<ProfileGuidePreviewView />);
    click('Saludar');
    act(() => vi.advanceTimersByTime(300));

    click('Hablar');
    act(() => vi.advanceTimersByTime(0));
    expect(getPlaygroundFrame()).toBe('talk');

    click('Dejar de hablar');
    expect(getPlaygroundFrame()).toBe('wave');
  });

  it('pops the check when the section is completed', () => {
    render(<ProfileGuidePreviewView />);
    click('Completar sección');

    expect(countAnimations(PROFILE_GUIDE_POP_KEYFRAMES)).toBe(1);
    expect(
      screen.getByRole('button', { name: 'Desmarcar sección' }),
    ).toBeInTheDocument();
  });

  it('counts the percentage up and replays the celebration', () => {
    render(<ProfileGuidePreviewView />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1300));
    expect(screen.getByText('100%')).toBeInTheDocument();

    click('Repetir');
    expect(countAnimations(PROFILE_GUIDE_CELEBRATION_ENTRANCE_KEYFRAMES)).toBe(2);
  });

  it('minimizes and restores the bubble and changes its text', () => {
    render(<ProfileGuidePreviewView />);
    expect(
      screen.getByText('Hola, soy tu asistente. Te ayudo a completar tu perfil.'),
    ).toBeInTheDocument();

    click('Cambiar texto');
    expect(
      screen.getByText('Empieza por tus datos de contacto.'),
    ).toBeInTheDocument();
    expect(countAnimations(PROFILE_GUIDE_BUBBLE_KEYFRAMES.pop)).toBe(1);

    click('Minimizar globo');
    act(() =>
      animations
        .find(
          (animation) =>
            animation.keyframes === PROFILE_GUIDE_BUBBLE_KEYFRAMES.close,
        )
        ?.finish(),
    );
    expect(
      screen.queryByText('Empieza por tus datos de contacto.'),
    ).not.toBeInTheDocument();

    click('Restaurar globo');
    expect(
      screen.getByText('Empieza por tus datos de contacto.'),
    ).toBeInTheDocument();
  });
});
