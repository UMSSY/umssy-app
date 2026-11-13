'use client';

import { useEffect, useState } from 'react';
import { PROFILE_GUIDE_DURATIONS_MS } from '../constants/profile-guide-animation.constants';
import type { CountUpOptions } from '../types/count-up-options.types';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

export function useCountUp(
  target: number,
  {
    durationMs = PROFILE_GUIDE_DURATIONS_MS.countUp,
    isEnabled = true,
  }: CountUpOptions = {},
): number {
  const isReducedMotion = usePrefersReducedMotion();
  const isAnimated = isEnabled && !isReducedMotion && target > 0;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isAnimated) return;

    let startTime: number | null = null;
    let frame = window.requestAnimationFrame(function step(timestamp) {
      startTime ??= timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [durationMs, isAnimated, target]);

  return isAnimated ? Math.min(value, target) : target;
}
