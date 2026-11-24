import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';

export const PROFILE_COMPLETENESS_ROUTES = {
  contact: '/profile/settings',
  presentation: '/profile/settings',
  education: '/profile',
  'work-experience': '/profile',
  skills: '/profile',
  certifications: '/profile',
  cv: '/profile/documents',
} as const satisfies Record<ProfileCompletenessSectionId, string>;

export const PROFILE_COMPLETENESS_HASH_PREFIX = '#complete-';
