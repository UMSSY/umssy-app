'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { ElementAnimation } from '../types/element-animation.types';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

export function useElementAnimation(): ElementAnimation {
  const isReducedMotion = usePrefersReducedMotion();
  const animationsRef = useRef(new Set<Animation>());

  useEffect(() => {
    const animations = animationsRef.current;
    return () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
  }, []);

  const animate = useCallback<ElementAnimation['animate']>(
    (element, keyframes, options) => {
      if (isReducedMotion || !element) return null;
      if (typeof element.animate !== 'function') return null;

      const animations = animationsRef.current;
      animations.forEach((animation) => {
        const { playState } = animation;
        if (playState === 'finished' || playState === 'idle') {
          animations.delete(animation);
        }
      });

      const animation = element.animate(keyframes, options);
      animations.add(animation);
      return animation;
    },
    [isReducedMotion],
  );

  return { animate, isReducedMotion };
}
