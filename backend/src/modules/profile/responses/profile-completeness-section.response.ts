import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.type.js';

export interface ProfileCompletenessSectionResponse {
  id: ProfileCompletenessSectionId;
  weight: number;
  isCompleted: boolean;
}
