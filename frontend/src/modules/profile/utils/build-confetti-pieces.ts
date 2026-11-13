import {
  PROFILE_GUIDE_CONFETTI,
  PROFILE_GUIDE_EASINGS,
} from '../constants/profile-guide-animation.constants';
import type { ProfileGuideConfettiPiece } from '../types/profile-guide-confetti-piece.types';

const MIN_ANGLE_DEG = 30;
const ANGLE_RANGE_DEG = 120;
const GOLDEN_ANGLE_DEG = 137.5;
const PEAK_OFFSET = 0.45;

/**
 * Deterministic confetti: every value comes from the index, so the server and
 * the client render the same pieces without Math.random.
 */
export function buildConfettiPieces(
  count: number = PROFILE_GUIDE_CONFETTI.count,
): ProfileGuideConfettiPiece[] {
  const { colorClasses, sizeClasses, shapeClasses } = PROFILE_GUIDE_CONFETTI;

  return Array.from({ length: count }, (_, index) => {
    const angle =
      ((MIN_ANGLE_DEG + ((index * GOLDEN_ANGLE_DEG) % ANGLE_RANGE_DEG)) *
        Math.PI) /
      180;
    const distance =
      PROFILE_GUIDE_CONFETTI.minDistancePx +
      ((index * 37) % PROFILE_GUIDE_CONFETTI.distanceRangePx);
    const color =
      colorClasses[(index * 3 + Math.floor(index / 4)) % colorClasses.length];
    const spin = index % 2 === 0 ? 1 : -1;

    return {
      id: index,
      className: [
        color,
        sizeClasses[index % sizeClasses.length],
        shapeClasses[index % shapeClasses.length],
      ].join(' '),
      offsetX: Math.round(Math.cos(angle) * distance),
      offsetY: -Math.round(Math.sin(angle) * distance),
      rotation: spin * (180 + ((index * 53) % 360)),
      delayMs: (index * 67) % (PROFILE_GUIDE_CONFETTI.maxStaggerMs + 1),
    };
  });
}

/** The piece rises, spreads and then falls while it fades out. */
export function buildConfettiKeyframes(
  piece: ProfileGuideConfettiPiece,
): Keyframe[] {
  return [
    {
      transform: 'translate(0px, 0px) rotate(0deg) scale(0.6)',
      opacity: 1,
      easing: PROFILE_GUIDE_EASINGS.out,
    },
    {
      transform: `translate(${piece.offsetX}px, ${piece.offsetY}px) rotate(${piece.rotation * PEAK_OFFSET}deg) scale(1)`,
      opacity: 1,
      offset: PEAK_OFFSET,
      easing: 'ease-in',
    },
    {
      transform: `translate(${Math.round(piece.offsetX * 1.25)}px, ${piece.offsetY + PROFILE_GUIDE_CONFETTI.fallPx}px) rotate(${piece.rotation}deg) scale(0.9)`,
      opacity: 0,
    },
  ];
}
