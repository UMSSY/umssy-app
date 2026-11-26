import type { ProfileGuideEntrance } from './profile-guide-entrance.types';
import type { ProfileGuideMascotSize } from './profile-guide-mascot-size.types';
import type { ProfileGuidePose } from './profile-guide-pose.types';
import type { ProfileGuideStepDirection } from './profile-guide-step-direction.types';

export interface ProfileGuideMascotProps {
  pose: ProfileGuidePose;
  size?: ProfileGuideMascotSize;
  entrance?: ProfileGuideEntrance;
  isFloating?: boolean;
  isTalking?: boolean;
  stepKey?: string | number;
  stepDirection?: ProfileGuideStepDirection;
  celebrationKey?: string | number;
  priority?: boolean;
  className?: string;
}
