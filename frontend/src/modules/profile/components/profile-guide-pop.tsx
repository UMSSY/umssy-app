'use client';

import { useEffect, useRef } from 'react';
import { cn } from 'cn';
import {
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
  PROFILE_GUIDE_POP_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import { useElementAnimation } from '../hooks/use-element-animation';
import type { ProfileGuidePopProps } from '../types/profile-guide-pop-props.types';

export function ProfileGuidePop({
  isActive,
  children,
  className,
}: ProfileGuidePopProps) {
  const { animate } = useElementAnimation();
  const ref = useRef<HTMLSpanElement>(null);
  const wasActiveRef = useRef(isActive);

  useEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = isActive;
    if (!isActive || wasActive) return;

    const animation = animate(ref.current, PROFILE_GUIDE_POP_KEYFRAMES, {
      duration: PROFILE_GUIDE_DURATIONS_MS.pop,
      easing: PROFILE_GUIDE_EASINGS.spring,
    });
    return () => animation?.cancel();
  }, [animate, isActive]);

  return (
    <span ref={ref} className={cn('inline-flex', className)}>
      {children}
    </span>
  );
}
