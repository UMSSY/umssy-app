import type { ProfileCompletenessResponse } from '../types/profile-completeness-response.types';
import type { ProfileCompletenessSectionId } from '../types/profile-completeness-section-id.types';

export function createProfileCompleteness(
  completedIds: readonly ProfileCompletenessSectionId[] = [],
): ProfileCompletenessResponse {
  const sections = [
    { id: 'contact', weight: 20 },
    { id: 'presentation', weight: 15 },
    { id: 'education', weight: 20 },
    { id: 'work-experience', weight: 20 },
    { id: 'skills', weight: 15 },
    { id: 'certifications', weight: 10 },
  ] as const;

  return {
    percentage: sections.reduce(
      (total, section) =>
        total + (completedIds.includes(section.id) ? section.weight : 0),
      0,
    ),
    sections: sections.map((section) => ({
      ...section,
      isCompleted: completedIds.includes(section.id),
    })),
  };
}
