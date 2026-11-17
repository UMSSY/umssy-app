'use client';

import { useLayoutEffect, useRef } from 'react';
import {
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
  PROFILE_GUIDE_REVEAL_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import { useElementAnimation } from '../hooks/use-element-animation';
import type { ProfileGuideRevealProps } from '../types/profile-guide-reveal-props.types';

export function ProfileGuideReveal({
  delayMs = 0,
  children,
  className,
}: ProfileGuideRevealProps) {
  const { animate } = useElementAnimation();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const animation = animate(ref.current, PROFILE_GUIDE_REVEAL_KEYFRAMES, {
      duration: PROFILE_GUIDE_DURATIONS_MS.reveal,
      delay: delayMs,
      easing: PROFILE_GUIDE_EASINGS.out,
      fill: 'both',
    });
    return () => animation?.cancel();
  }, [animate, delayMs]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
