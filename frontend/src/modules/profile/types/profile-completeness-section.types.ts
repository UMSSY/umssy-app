import type { ProfileCompletenessSectionId } from './profile-completeness-section-id.types';

export interface ProfileCompletenessSection {
  id: ProfileCompletenessSectionId;
  weight: number;
  isCompleted: boolean;
}
