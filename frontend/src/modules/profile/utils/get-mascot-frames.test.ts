import { describe, expect, it } from 'vitest';
import { getMascotFrames } from './get-mascot-frames';

const base = {
  pose: 'wave',
  previousPose: null,
  hasFrameAnimation: true,
  hasStep: false,
  hasCelebration: false,
} as const;

describe('getMascotFrames', () => {
  it('returns the whole wave group when frames are animated', () => {
    expect(getMascotFrames(base)).toEqual([
      'wave',
      'wave-b',
      'wave-low',
      'blink',
      'talk',
    ]);
  });

  it('returns only the main frame without frame animation', () => {
    expect(getMascotFrames({ ...base, hasFrameAnimation: false })).toEqual([
      'wave',
    ]);
  });

  it('returns a single frame for poses without a group', () => {
    expect(getMascotFrames({ ...base, pose: 'point' })).toEqual(['point']);
    expect(getMascotFrames({ ...base, pose: 'celebrate' })).toEqual([
      'celebrate',
    ]);
  });

  it('keeps the previous pose while it fades out', () => {
    expect(
      getMascotFrames({ ...base, pose: 'point', previousPose: 'wave' }),
    ).toEqual(['wave', 'point']);
  });

  it('adds the fly frame only when there is a step key', () => {
    expect(getMascotFrames({ ...base, pose: 'point', hasStep: true })).toEqual([
      'point',
      'fly',
    ]);
  });

  it('adds the celebrate frame only when there is a celebration key', () => {
    expect(
      getMascotFrames({ ...base, pose: 'point', hasCelebration: true }),
    ).toEqual(['point', 'celebrate']);
  });
});
