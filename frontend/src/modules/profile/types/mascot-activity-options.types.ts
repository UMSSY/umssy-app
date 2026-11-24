import type { ProfileGuideStepDirection } from './profile-guide-step-direction.types';

export interface MascotActivityOptions {
  stepKey: string | number | undefined;
  stepDirection: ProfileGuideStepDirection;
  celebrationKey: string | number | undefined;
}
