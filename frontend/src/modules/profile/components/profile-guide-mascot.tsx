'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from 'cn';
import {
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
  PROFILE_GUIDE_ENTRANCE_KEYFRAMES,
  PROFILE_GUIDE_FLOAT_AMPLITUDES_PX,
  PROFILE_GUIDE_FRAME_SOURCES,
  PROFILE_GUIDE_MASCOT_SIZE_CLASSES,
  PROFILE_GUIDE_MASCOT_SIZES_PX,
  PROFILE_GUIDE_MESSAGES,
  PROFILE_GUIDE_POSE_CROSSFADE_CLASS,
  PROFILE_GUIDE_SWAY_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import { useElementAnimation } from '../hooks/use-element-animation';
import { useProfileGuideMascotActivity } from '../hooks/use-profile-guide-mascot-activity';
import { useProfileGuideMascotFrame } from '../hooks/use-profile-guide-mascot-frame';
import type { ProfileGuideMascotProps } from '../types/profile-guide-mascot-props.types';
import type { ProfileGuidePose } from '../types/profile-guide-pose.types';
import { getMascotFrames } from '../utils/get-mascot-frames';

const CROSSFADE_CLEANUP_MARGIN_MS = 40;

export function ProfileGuideMascot({
  pose,
  size = 'md',
  entrance = 'none',
  isFloating = true,
  isTalking = false,
  stepKey,
  stepDirection = 'forward',
  celebrationKey,
  priority = false,
  className,
}: ProfileGuideMascotProps) {
  const { animate, isReducedMotion } = useElementAnimation();
  const entranceRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const swayRef = useRef<HTMLDivElement>(null);
  const {
    layerRef: activityRef,
    overridePose,
    isFlyMirrored,
  } = useProfileGuideMascotActivity({ stepKey, stepDirection, celebrationKey });

  // Poses crossfade; `previous` stays mounted until the fade is over.
  const displayedPose = overridePose ?? pose;
  const [fade, setFade] = useState<{
    current: ProfileGuidePose;
    previous: ProfileGuidePose | null;
  }>({ current: displayedPose, previous: null });
  if (fade.current !== displayedPose) {
    setFade({ current: displayedPose, previous: fade.current });
  }
  const isCrossfading = fade.previous !== null;

  const hasFrameAnimation = size !== 'sm' && !isReducedMotion;
  const isWaving = displayedPose === 'wave';
  const { frame: waveFrame, playGreeting } = useProfileGuideMascotFrame({
    isEnabled: hasFrameAnimation && isWaving && !isCrossfading,
    isTalking,
  });
  const activeFrame = isWaving ? waveFrame : displayedPose;
  const frames = getMascotFrames({
    pose,
    previousPose: fade.previous,
    hasFrameAnimation,
    hasStep: stepKey !== undefined,
    hasCelebration: celebrationKey !== undefined,
  });

  useEffect(() => {
    if (!isCrossfading) return;
    const timer = window.setTimeout(
      () => setFade((value) => ({ ...value, previous: null })),
      PROFILE_GUIDE_DURATIONS_MS.poseCrossfade + CROSSFADE_CLEANUP_MARGIN_MS,
    );
    return () => window.clearTimeout(timer);
  }, [fade, isCrossfading]);

  useLayoutEffect(() => {
    if (entrance !== 'pop') return;
    const animation = animate(
      entranceRef.current,
      PROFILE_GUIDE_ENTRANCE_KEYFRAMES,
      {
        duration: PROFILE_GUIDE_DURATIONS_MS.entrance,
        easing: PROFILE_GUIDE_EASINGS.spring,
      },
    );
    if (!animation) return;
    animation.onfinish = playGreeting;
    return () => animation.cancel();
  }, [animate, entrance, playGreeting]);

  useEffect(() => {
    if (!isFloating) return;
    const animation = animate(
      floatRef.current,
      [
        { transform: 'translateY(0px)' },
        {
          transform: `translateY(-${PROFILE_GUIDE_FLOAT_AMPLITUDES_PX[size]}px)`,
        },
      ],
      {
        duration: PROFILE_GUIDE_DURATIONS_MS.float,
        delay: entrance === 'pop' ? PROFILE_GUIDE_DURATIONS_MS.entrance : 0,
        easing: PROFILE_GUIDE_EASINGS.inOut,
        direction: 'alternate',
        iterations: Infinity,
      },
    );
    return () => animation?.cancel();
  }, [animate, entrance, isFloating, size]);

  useEffect(() => {
    if (!isWaving) return;
    const animation = animate(swayRef.current, PROFILE_GUIDE_SWAY_KEYFRAMES, {
      duration: PROFILE_GUIDE_DURATIONS_MS.sway,
      easing: PROFILE_GUIDE_EASINGS.inOut,
      direction: 'alternate',
      iterations: Infinity,
    });
    return () => animation?.cancel();
  }, [animate, isWaving]);

  return (
    <div
      role="img"
      aria-label={PROFILE_GUIDE_MESSAGES.mascotLabel}
      className={cn(
        'relative shrink-0',
        PROFILE_GUIDE_MASCOT_SIZE_CLASSES[size],
        className,
      )}
    >
      <div ref={entranceRef} className="size-full">
        <div ref={activityRef} className="size-full">
          <div ref={floatRef} className="size-full">
            <div ref={swayRef} className="relative size-full origin-[50%_90%]">
              {frames.map((frame) => {
                const isPreloaded = priority && frame === pose;
                return (
                  <Image
                    key={frame}
                    src={PROFILE_GUIDE_FRAME_SOURCES[frame]}
                    alt=""
                    aria-hidden="true"
                    data-frame={frame}
                    fill
                    sizes={`${PROFILE_GUIDE_MASCOT_SIZES_PX[size]}px`}
                    preload={isPreloaded}
                    loading={isPreloaded ? undefined : 'eager'}
                    draggable={false}
                    className={cn(
                      'absolute inset-0 object-contain select-none',
                      frame === activeFrame ? 'opacity-100' : 'opacity-0',
                      isCrossfading
                        ? PROFILE_GUIDE_POSE_CROSSFADE_CLASS
                        : 'transition-none',
                      frame === 'fly' && isFlyMirrored && '-scale-x-100',
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
