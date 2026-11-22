import type { ProfileCompletenessSectionId } from './profile-completeness-section-id.types';
import type { ProfileReviewGuard } from './profile-review-guard.type';

export interface ProfileGuideContextValue {
  isEnabled: boolean;
  isComplete: boolean;
  hasFinished?: boolean;
  start: (step?: ProfileCompletenessSectionId) => void;
  registerReviewGuard?: (guard: ProfileReviewGuard) => () => void;
}
