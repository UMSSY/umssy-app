import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import type { ProfileCompletenessResponse } from '../types/profile-completeness-response.types';
import type { ProfileGuideSession } from '../types/profile-guide-session.types';

export function getProfileGuideResumeStep(
  completeness: ProfileCompletenessResponse,
  session: ProfileGuideSession,
) {
  const pending = PROFILE_COMPLETENESS_SECTION_IDS.filter((id) =>
    completeness.sections.some(
      (section) => section.id === id && !section.isCompleted,
    ),
  );
  if (session.lastStep && pending.includes(session.lastStep))
    return session.lastStep;
  return (
    pending.find((id) => !session.skipped.includes(id)) ??
    pending[0] ??
    PROFILE_COMPLETENESS_SECTION_IDS[0]
  );
}
