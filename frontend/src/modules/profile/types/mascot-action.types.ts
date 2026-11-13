import type { ProfileGuideStepDirection } from './profile-guide-step-direction.types';

export type MascotAction =
  | { kind: 'step'; direction: ProfileGuideStepDirection }
  | { kind: 'celebrate' };
