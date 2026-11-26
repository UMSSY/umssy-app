import type { ProfileCompletenessSection } from './profile-completeness-section.types';

export interface ProfileCompletenessResponse {
  percentage: number;
  sections: ProfileCompletenessSection[];
}
