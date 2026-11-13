'use client';

import { useEffect, useRef } from 'react';
import { cn } from 'cn';
import {
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
  PROFILE_GUIDE_SPARKLE_CLASSES,
  PROFILE_GUIDE_SPARKLE_KEYFRAMES,
  PROFILE_GUIDE_SPARKLE_PATH,
} from '../constants/profile-guide-animation.constants';
import { useElementAnimation } from '../hooks/use-element-animation';
import type { ProfileGuideSparklesProps } from '../types/profile-guide-sparkles-props.types';

export function ProfileGuideSparkles({ className }: ProfileGuideSparklesProps) {
  const { animate } = useElementAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sparkles = [...(containerRef.current?.children ?? [])];
    const animations = sparkles.map((sparkle, index) =>
      animate(sparkle, PROFILE_GUIDE_SPARKLE_KEYFRAMES, {
        duration: PROFILE_GUIDE_DURATIONS_MS.sparkle,
        delay: index * PROFILE_GUIDE_DURATIONS_MS.sparkleStagger,
        easing: PROFILE_GUIDE_EASINGS.inOut,
        direction: 'alternate',
        iterations: Infinity,
        fill: 'backwards',
      }),
    );
    return () => animations.forEach((animation) => animation?.cancel());
  }, [animate]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      {PROFILE_GUIDE_SPARKLE_CLASSES.map((sparkleClass) => (
        <svg
          key={sparkleClass}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cn('absolute opacity-80', sparkleClass)}
        >
          <path d={PROFILE_GUIDE_SPARKLE_PATH} />
        </svg>
      ))}
    </div>
  );
}
