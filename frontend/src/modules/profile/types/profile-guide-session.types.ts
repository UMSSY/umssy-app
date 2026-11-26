import type { ProfileCompletenessSectionId } from './profile-completeness-section-id.types';

export interface ProfileGuideSession {
  version: 1;
  dismissed: boolean;
  completed: boolean;
  lastStep: ProfileCompletenessSectionId | null;
  skipped: ProfileCompletenessSectionId[];
}
