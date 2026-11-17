'use client';

import { useLayoutEffect, useRef } from 'react';
import { cn } from 'cn';
import {
  PROFILE_GUIDE_CELEBRATION_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_CELEBRATION_JUMPS,
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
  PROFILE_GUIDE_JUMP_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import { useElementAnimation } from '../hooks/use-element-animation';
import type { ProfileGuideCelebrationProps } from '../types/profile-guide-celebration-props.types';
import { ProfileGuideConfetti } from './profile-guide-confetti';
import { ProfileGuideMascot } from './profile-guide-mascot';
import { ProfileGuideSparkles } from './profile-guide-sparkles';

export function ProfileGuideCelebration({
  hasConfetti = true,
  className,
}: ProfileGuideCelebrationProps) {
  const { animate } = useElementAnimation();
  const entranceRef = useRef<HTMLDivElement>(null);
  const jumpRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const animations = [
      animate(
        entranceRef.current,
        PROFILE_GUIDE_CELEBRATION_ENTRANCE_KEYFRAMES,
        {
          duration: PROFILE_GUIDE_DURATIONS_MS.celebrationEntrance,
          easing: PROFILE_GUIDE_EASINGS.spring,
        },
      ),
      animate(jumpRef.current, PROFILE_GUIDE_JUMP_KEYFRAMES, {
        duration: PROFILE_GUIDE_DURATIONS_MS.jump,
        delay: PROFILE_GUIDE_DURATIONS_MS.celebrationEntrance,
        easing: PROFILE_GUIDE_EASINGS.out,
        iterations: PROFILE_GUIDE_CELEBRATION_JUMPS,
      }),
    ];
    return () => animations.forEach((animation) => animation?.cancel());
  }, [animate]);

  return (
    <div
      className={cn(
        'relative flex size-56 items-center justify-center',
        className,
      )}
    >
      <ProfileGuideSparkles />
      <div ref={entranceRef}>
        <div ref={jumpRef} className="origin-bottom">
          <ProfileGuideMascot pose="celebrate" />
        </div>
      </div>
      {hasConfetti ? <ProfileGuideConfetti /> : null}
    </div>
  );
}
