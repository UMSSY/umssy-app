'use client';

import { cn } from 'cn';
import type { ProfileGuideWelcomeHeroProps } from '../types/profile-guide-welcome-hero-props.types';
import { ProfileGuideMascot } from './profile-guide-mascot';
import { ProfileGuideRings } from './profile-guide-rings';

export function ProfileGuideWelcomeHero({
  className,
}: ProfileGuideWelcomeHeroProps) {
  return (
    <div
      className={cn(
        'relative flex aspect-square w-full max-w-80 items-center justify-center overflow-hidden',
        className,
      )}
    >
      <ProfileGuideRings />
      <ProfileGuideMascot pose="wave" size="lg" entrance="pop" className="aspect-square h-auto max-w-[90%]" priority />
    </div>
  );
}
