import type { ProfileGuideEntrance } from './profile-guide-entrance.types';
import type { ProfileGuideMascotSize } from './profile-guide-mascot-size.types';
import type { ProfileGuidePose } from './profile-guide-pose.types';
import type { ProfileGuideStepDirection } from './profile-guide-step-direction.types';

export interface ProfileGuideMascotProps {
  /** Resting pose. */
  pose: ProfileGuidePose;
  /** Defaults to "md" (sm = 48 px, md = 128 px, lg = 288 px). */
  size?: ProfileGuideMascotSize;
  /** Defaults to "none". */
  entrance?: ProfileGuideEntrance;
  /** Defaults to true. */
  isFloating?: boolean;
  /** Defaults to false. Moves the mouth, only with the "wave" pose. */
  isTalking?: boolean;
  /** Runs the step transition when it changes after mount. */
  stepKey?: string | number;
  /** Defaults to "forward" (to the right). */
  stepDirection?: ProfileGuideStepDirection;
  /** Runs the brief celebration when it changes after mount. */
  celebrationKey?: string | number;
  /** Defaults to false. Preloads the resting frame. */
  priority?: boolean;
  className?: string;
}
