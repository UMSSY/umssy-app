import { describe, expect, it } from 'vitest';
import { PROFILE_GUIDE_REST_TRANSFORM } from '../constants/profile-guide-animation.constants';
import { buildStepKeyframes } from './build-step-keyframes';

describe('buildStepKeyframes', () => {
  it('moves to the right and back when going forward', () => {
    const transforms = buildStepKeyframes('forward').map(
      (keyframe) => keyframe.transform,
    );

    expect(transforms).toEqual([
      PROFILE_GUIDE_REST_TRANSFORM,
      'translateX(28px) rotate(6deg) scale(0.94)',
      'translateX(-6px) rotate(-3deg) scale(1.03)',
      PROFILE_GUIDE_REST_TRANSFORM,
    ]);
  });

  it('mirrors X and rotation when going backward', () => {
    const transforms = buildStepKeyframes('backward').map(
      (keyframe) => keyframe.transform,
    );

    expect(transforms[1]).toBe('translateX(-28px) rotate(-6deg) scale(0.94)');
    expect(transforms[2]).toBe('translateX(6px) rotate(3deg) scale(1.03)');
  });

  it('ends the outbound trip at 260 of 650 ms', () => {
    const keyframes = buildStepKeyframes('forward');

    expect(keyframes[1].offset).toBeCloseTo(0.4);
    expect(keyframes.every((keyframe) => 'transform' in keyframe)).toBe(true);
  });

  it('resumes from the transform of an interrupted trip', () => {
    const [first] = buildStepKeyframes('forward', 'matrix(1, 0, 0, 1, 12, 0)');

    expect(first.transform).toBe('matrix(1, 0, 0, 1, 12, 0)');
  });
});
