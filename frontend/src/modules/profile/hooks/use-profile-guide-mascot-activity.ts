'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
  PROFILE_GUIDE_JUMP_KEYFRAMES,
} from '../constants/profile-guide-animation.constants';
import type { MascotActivityOptions } from '../types/mascot-activity-options.types';
import type { ProfileGuidePose } from '../types/profile-guide-pose.types';
import { buildStepKeyframes } from '../utils/build-step-keyframes';
import {
  finishMascotAction,
  INITIAL_MASCOT_ACTIVITY,
  requestMascotAction,
} from '../utils/reduce-mascot-activity';
import { useElementAnimation } from './use-element-animation';

function readTransform(element: Element): string | null {
  const { transform } = window.getComputedStyle(element);
  return transform && transform !== 'none' ? transform : null;
}

/**
 * Step transition (`stepKey`) and brief celebration (`celebrationKey`). Both
 * run only when their key changes after mount. With reduced motion the pose
 * still changes, without any movement.
 */
export function useProfileGuideMascotActivity({
  stepKey,
  stepDirection,
  celebrationKey,
}: MascotActivityOptions) {
  const { animate } = useElementAnimation();
  const layerRef = useRef<HTMLDivElement>(null);
  const resumeTransformRef = useRef<string | null>(null);
  const [seenKeys, setSeenKeys] = useState({ stepKey, celebrationKey });
  const [activity, setActivity] = useState(INITIAL_MASCOT_ACTIVITY);
  const [landedId, setLandedId] = useState(0);

  const hasNewCelebration = seenKeys.celebrationKey !== celebrationKey;
  const hasNewStep = seenKeys.stepKey !== stepKey;
  if (hasNewCelebration || hasNewStep) {
    let next = activity;
    if (hasNewCelebration) {
      next = requestMascotAction(next, { kind: 'celebrate' });
    }
    if (hasNewStep) {
      next = requestMascotAction(next, {
        kind: 'step',
        direction: stepDirection,
      });
    }
    setSeenKeys({ stepKey, celebrationKey });
    setActivity(next);
  }

  const { current } = activity;

  useEffect(() => {
    if (!current) return;

    const layer = layerRef.current;
    const finish = () => setActivity(finishMascotAction);
    const timers: number[] = [];
    let animation: Animation | null;

    if (current.kind === 'step') {
      animation = animate(
        layer,
        buildStepKeyframes(current.direction, resumeTransformRef.current),
        { duration: PROFILE_GUIDE_DURATIONS_MS.stepTransition },
      );
      resumeTransformRef.current = null;
      timers.push(
        window.setTimeout(
          () => setLandedId(current.id),
          PROFILE_GUIDE_DURATIONS_MS.stepLanding,
        ),
        window.setTimeout(finish, PROFILE_GUIDE_DURATIONS_MS.stepTransition),
      );
    } else {
      animation = animate(layer, PROFILE_GUIDE_JUMP_KEYFRAMES, {
        duration: PROFILE_GUIDE_DURATIONS_MS.jump,
        delay: PROFILE_GUIDE_DURATIONS_MS.poseCrossfade,
        easing: PROFILE_GUIDE_EASINGS.out,
      });
      timers.push(
        window.setTimeout(finish, PROFILE_GUIDE_DURATIONS_MS.celebrationBrief),
      );
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      if (animation && layer) {
        resumeTransformRef.current = readTransform(layer);
        animation.cancel();
      }
    };
  }, [animate, current]);

  let overridePose: ProfileGuidePose | null = null;
  if (current?.kind === 'celebrate') overridePose = 'celebrate';
  else if (current && current.id !== landedId) overridePose = 'fly';

  return {
    layerRef,
    overridePose,
    isFlyMirrored: current?.kind === 'step' && current.direction === 'backward',
  };
}
