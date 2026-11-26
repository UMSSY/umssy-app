import type { ProfileCompletenessSectionResponse } from './profile-completeness-section.response.js';

export interface ProfileCompletenessResponse {
  percentage: number;
  sections: ProfileCompletenessSectionResponse[];
}
