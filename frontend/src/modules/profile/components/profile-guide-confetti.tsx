'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import {
  PROFILE_GUIDE_CONFETTI,
  PROFILE_GUIDE_DURATIONS_MS,
} from '../constants/profile-guide-animation.constants';
import { useElementAnimation } from '../hooks/use-element-animation';
import type { ProfileGuideConfettiProps } from '../types/profile-guide-confetti-props.types';
import {
  buildConfettiKeyframes,
  buildConfettiPieces,
} from '../utils/build-confetti-pieces';

const CONFETTI_PIECES = buildConfettiPieces();
const CONFETTI_TOTAL_MS =
  PROFILE_GUIDE_CONFETTI.startDelayMs +
  PROFILE_GUIDE_CONFETTI.maxStaggerMs +
  PROFILE_GUIDE_DURATIONS_MS.confetti;

export function ProfileGuideConfetti({ className }: ProfileGuideConfettiProps) {
  const { animate, isReducedMotion } = useElementAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const animations = CONFETTI_PIECES.map((piece, index) =>
      animate(container.children[index], buildConfettiKeyframes(piece), {
        duration: PROFILE_GUIDE_DURATIONS_MS.confetti,
        delay: PROFILE_GUIDE_CONFETTI.startDelayMs + piece.delayMs,
        fill: 'forwards',
      }),
    );
    const timer = window.setTimeout(() => setIsDone(true), CONFETTI_TOTAL_MS);

    return () => {
      window.clearTimeout(timer);
      animations.forEach((animation) => animation?.cancel());
    };
  }, [animate]);

  if (isReducedMotion || isDone) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      {CONFETTI_PIECES.map((piece) => (
        <span
          key={piece.id}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/4 left-1/2 opacity-0',
            piece.className,
          )}
        />
      ))}
    </div>
  );
}
