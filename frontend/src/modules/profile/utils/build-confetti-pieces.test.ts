import { describe, expect, it } from 'vitest';
import { PROFILE_GUIDE_CONFETTI } from '../constants/profile-guide-animation.constants';
import {
  buildConfettiKeyframes,
  buildConfettiPieces,
} from './build-confetti-pieces';

describe('buildConfettiPieces', () => {
  it('builds sixteen pieces by default', () => {
    expect(buildConfettiPieces()).toHaveLength(16);
  });

  it('is deterministic', () => {
    expect(buildConfettiPieces()).toEqual(buildConfettiPieces());
    expect(buildConfettiPieces(4)).toEqual(buildConfettiPieces().slice(0, 4));
  });

  it('alternates rectangles and circles with theme colors', () => {
    const pieces = buildConfettiPieces();

    pieces.forEach((piece, index) => {
      const [color, size, shape] = piece.className.split(' ');
      expect(PROFILE_GUIDE_CONFETTI.colorClasses).toContain(color);
      expect(PROFILE_GUIDE_CONFETTI.sizeClasses).toContain(size);
      expect(shape).toBe(index % 2 === 0 ? 'rounded-[1px]' : 'rounded-full');
    });
    expect(
      new Set(pieces.map((piece) => piece.className.split(' ')[0])).size,
    ).toBe(4);
  });

  it('throws every piece upwards within the stagger window', () => {
    buildConfettiPieces().forEach((piece) => {
      expect(piece.offsetY).toBeLessThan(0);
      expect(piece.delayMs).toBeGreaterThanOrEqual(0);
      expect(piece.delayMs).toBeLessThanOrEqual(180);
    });
  });

  it('spreads the pieces to both sides', () => {
    const offsets = buildConfettiPieces().map((piece) => piece.offsetX);

    expect(Math.min(...offsets)).toBeLessThan(0);
    expect(Math.max(...offsets)).toBeGreaterThan(0);
  });
});

describe('buildConfettiKeyframes', () => {
  it('animates only transform and opacity and ends invisible below the peak', () => {
    const [piece] = buildConfettiPieces(1);
    const keyframes = buildConfettiKeyframes(piece);

    expect(keyframes).toHaveLength(3);
    keyframes.forEach((keyframe) => {
      expect(keyframe.transform).toEqual(expect.any(String));
      expect(keyframe.opacity).toEqual(expect.any(Number));
    });
    expect(keyframes[1].transform).toContain(
      `translate(${piece.offsetX}px, ${piece.offsetY}px)`,
    );
    expect(keyframes[2].transform).toContain(`${piece.offsetY + 90}px)`);
    expect(keyframes[2].opacity).toBe(0);
  });
});
