'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import type { ProfileGuideTravelOptions } from '../types/profile-guide-travel-options.types';
import { useElementAnimation } from './use-element-animation';

const TRAVEL_DURATION_MS = 220;
const TRAVEL_FALLBACK_MS = 260;

function transform(x: number, y: number, tilt = 0) {
  return `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`;
}

export function useProfileGuideTravel({
  travelKey,
  side,
  onArrive,
}: ProfileGuideTravelOptions) {
  const mascotRef = useRef<HTMLDivElement | null>(null);
  const originRef = useRef<DOMRect | null>(null);
  const completedKeyRef = useRef<number | null>(null);
  const onArriveRef = useRef(onArrive);
  const { animate } = useElementAnimation();

  useLayoutEffect(() => {
    onArriveRef.current = onArrive;
  }, [onArrive]);

  const captureOrigin = useCallback(() => {
    originRef.current = mascotRef.current?.getBoundingClientRect() ?? null;
  }, []);

  useLayoutEffect(() => {
    if (travelKey <= 0 || completedKeyRef.current === travelKey) return;

    const origin = originRef.current;
    const destination = mascotRef.current?.getBoundingClientRect();
    originRef.current = null;
    const deltaX =
      origin && destination
        ? origin.left +
          origin.width / 2 -
          destination.left -
          destination.width / 2
        : 0;
    const deltaY =
      origin && destination
        ? origin.top +
          origin.height / 2 -
          destination.top -
          destination.height / 2
        : 0;
    const direction = side === 'right' ? 1 : -1;
    const arcX = Math.abs(deltaX) < 1 ? direction * 12 : deltaX * 0.52;
    const lift = Math.min(24, 10 + Math.abs(deltaX) * 0.04);
    const animation = animate(
      mascotRef.current,
      [
        { transform: transform(deltaX, deltaY) },
        {
          transform: transform(arcX, deltaY * 0.52 - lift, direction * 4),
          offset: 0.48,
        },
        { transform: transform(0, 0) },
      ],
      {
        duration: TRAVEL_DURATION_MS,
        easing: 'cubic-bezier(.22,.65,.3,1)',
        fill: 'both',
      },
    );
    let active = true;
    let fallbackTimer: number | undefined;

    function arrive() {
      if (!active || completedKeyRef.current === travelKey) return;
      completedKeyRef.current = travelKey;
      window.clearTimeout(fallbackTimer);
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
      }
      onArriveRef.current();
    }

    if (animation) {
      animation.onfinish = arrive;
      fallbackTimer = window.setTimeout(arrive, TRAVEL_FALLBACK_MS);
    } else {
      queueMicrotask(arrive);
    }

    return () => {
      active = false;
      window.clearTimeout(fallbackTimer);
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
      }
    };
  }, [animate, side, travelKey]);

  return { mascotRef, captureOrigin };
}
