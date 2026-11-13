import {
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_EASINGS,
  PROFILE_GUIDE_REST_TRANSFORM,
  PROFILE_GUIDE_STEP_TRAVEL_PX,
} from '../constants/profile-guide-animation.constants';
import type { ProfileGuideStepDirection } from '../types/profile-guide-step-direction.types';

const TILT_DEG = 6;
const OVERSHOOT_PX = 6;
const OVERSHOOT_TILT_DEG = 3;
const OVERSHOOT_OFFSET = 0.8;

/**
 * Outbound trip and springy return of the step transition. Backward mirrors
 * every X and rotation value. `fromTransform` resumes an interrupted trip.
 */
export function buildStepKeyframes(
  direction: ProfileGuideStepDirection,
  fromTransform: string | null = null,
): Keyframe[] {
  const sign = direction === 'forward' ? 1 : -1;
  const { stepOutbound, stepTransition } = PROFILE_GUIDE_DURATIONS_MS;

  return [
    {
      transform: fromTransform ?? PROFILE_GUIDE_REST_TRANSFORM,
      offset: 0,
      easing: PROFILE_GUIDE_EASINGS.inOut,
    },
    {
      transform: `translateX(${sign * PROFILE_GUIDE_STEP_TRAVEL_PX}px) rotate(${sign * TILT_DEG}deg) scale(0.94)`,
      offset: stepOutbound / stepTransition,
      easing: PROFILE_GUIDE_EASINGS.spring,
    },
    {
      transform: `translateX(${-sign * OVERSHOOT_PX}px) rotate(${-sign * OVERSHOOT_TILT_DEG}deg) scale(1.03)`,
      offset: OVERSHOOT_OFFSET,
      easing: PROFILE_GUIDE_EASINGS.out,
    },
    { transform: PROFILE_GUIDE_REST_TRANSFORM, offset: 1 },
  ];
}
