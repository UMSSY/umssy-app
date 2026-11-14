import type { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';

export type ProfileCompletenessSectionId =
  (typeof PROFILE_COMPLETENESS_SECTION_IDS)[number];
