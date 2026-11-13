'use client';

import { useEffect, useRef } from 'react';
import { cn } from 'cn';
import {
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
  PROFILE_GUIDE_RING_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_RING_PULSE_KEYFRAMES,
  PROFILE_GUIDE_RING_SIZE_CLASSES,
} from '../constants/profile-guide-animation.constants';
import { useElementAnimation } from '../hooks/use-element-animation';
import type { ProfileGuideRingsProps } from '../types/profile-guide-rings-props.types';

export function ProfileGuideRings({ className }: ProfileGuideRingsProps) {
  const { animate } = useElementAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rings = [...(containerRef.current?.children ?? [])];
    const animations = rings.flatMap((ring, index) => [
      animate(ring, PROFILE_GUIDE_RING_ENTRANCE_KEYFRAMES, {
        duration: PROFILE_GUIDE_DURATIONS_MS.ringEntrance,
        easing: PROFILE_GUIDE_EASINGS.out,
      }),
      animate(ring, PROFILE_GUIDE_RING_PULSE_KEYFRAMES, {
        duration: PROFILE_GUIDE_DURATIONS_MS.ring,
        delay:
          PROFILE_GUIDE_DURATIONS_MS.ringEntrance +
          index * PROFILE_GUIDE_DURATIONS_MS.ringStagger,
        easing: PROFILE_GUIDE_EASINGS.inOut,
        direction: 'alternate',
        iterations: Infinity,
      }),
    ]);
    return () => animations.forEach((animation) => animation?.cancel());
  }, [animate]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      {PROFILE_GUIDE_RING_SIZE_CLASSES.map((sizeClass) => (
        <span
          key={sizeClass}
          className={cn(
            'absolute inset-0 m-auto rounded-full border-2 border-primary/30 opacity-60',
            sizeClass,
          )}
        />
      ))}
    </div>
  );
}
