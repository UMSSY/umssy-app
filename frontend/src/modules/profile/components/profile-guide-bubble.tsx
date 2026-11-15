'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import {
  PROFILE_GUIDE_BUBBLE_KEYFRAMES,
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
} from '../constants/profile-guide-animation.constants';
import { useElementAnimation } from '../hooks/use-element-animation';
import type { ProfileGuideBubbleProps } from '../types/profile-guide-bubble-props.types';

function getBubbleKeyframes(isOpen: boolean, isReducedMotion: boolean) {
  if (isReducedMotion) {
    return isOpen
      ? PROFILE_GUIDE_BUBBLE_KEYFRAMES.fadeIn
      : PROFILE_GUIDE_BUBBLE_KEYFRAMES.fadeOut;
  }
  return isOpen
    ? PROFILE_GUIDE_BUBBLE_KEYFRAMES.open
    : PROFILE_GUIDE_BUBBLE_KEYFRAMES.close;
}

function getBubbleOptions(
  isOpen: boolean,
  isReducedMotion: boolean,
): KeyframeAnimationOptions {
  if (isReducedMotion) {
    return {
      duration: PROFILE_GUIDE_DURATIONS_MS.bubbleReducedMotion,
      fill: 'forwards',
    };
  }
  return isOpen
    ? {
        duration: PROFILE_GUIDE_DURATIONS_MS.bubbleIn,
        easing: PROFILE_GUIDE_EASINGS.spring,
      }
    : {
        duration: PROFILE_GUIDE_DURATIONS_MS.bubbleOut,
        easing: PROFILE_GUIDE_EASINGS.inOut,
        fill: 'forwards',
      };
}

export function ProfileGuideBubble({
  isOpen,
  popKey,
  children,
  className,
}: ProfileGuideBubbleProps) {
  const { animate, isReducedMotion } = useElementAnimation();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const seenPopKeyRef = useRef(popKey);

  // Stays rendered while the closing animation plays.
  const [isRendered, setIsRendered] = useState(isOpen);
  if (isOpen && !isRendered) setIsRendered(true);

  // The bubble fades even with reduced motion, so it does not go through
  // `animate`, which is disabled in that case.
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;

    const hide = () => setIsRendered(false);
    let timer = 0;
    let animation: Animation | null = null;
    if (typeof bubble.animate === 'function') {
      animation = bubble.animate(
        getBubbleKeyframes(isOpen, isReducedMotion),
        getBubbleOptions(isOpen, isReducedMotion),
      );
    }
    if (!isOpen) {
      if (animation) animation.onfinish = hide;
      else timer = window.setTimeout(hide, 0);
    }

    return () => {
      window.clearTimeout(timer);
      animation?.cancel();
    };
  }, [isOpen, isReducedMotion]);

  useEffect(() => {
    if (seenPopKeyRef.current === popKey) return;
    seenPopKeyRef.current = popKey;
    if (!isOpen) return;

    const animation = animate(
      contentRef.current,
      PROFILE_GUIDE_BUBBLE_KEYFRAMES.pop,
      {
        duration: PROFILE_GUIDE_DURATIONS_MS.bubblePop,
        easing: PROFILE_GUIDE_EASINGS.out,
      },
    );
    return () => animation?.cancel();
  }, [animate, isOpen, popKey]);

  if (!isRendered) return null;

  return (
    <div
      ref={bubbleRef}
      inert={!isOpen}
      className={cn(
        'origin-bottom-right rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink shadow-md',
        className,
      )}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
