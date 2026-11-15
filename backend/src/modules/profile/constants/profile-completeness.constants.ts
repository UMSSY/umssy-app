import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.type.js';

export const PROFILE_COMPLETENESS_SECTIONS = [
  { id: 'contact', weight: 20 },
  { id: 'presentation', weight: 15 },
  { id: 'education', weight: 20 },
  { id: 'work-experience', weight: 20 },
  { id: 'skills', weight: 15 },
  { id: 'certifications', weight: 10 },
] as const satisfies readonly {
  id: ProfileCompletenessSectionId;
  weight: number;
}[];

export const PROFILE_COMPLETENESS_MAX_PERCENTAGE = 100;
