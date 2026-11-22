import type { ProfileCompletenessSectionId } from './profile-completeness-section-id.types';

export interface ProfileGuideContextValue {
  isEnabled: boolean;
  isComplete: boolean;
  hasFinished?: boolean;
  start: (step?: ProfileCompletenessSectionId) => void;
}
