import type { MentorProfileEvaluation } from '../types/mentor-profile-evaluation.types.js';

/** Normalizes text for evaluation without changing the persisted profile. */
export function normalizeProfileText(value: string | null): string {
  return value?.trim() ?? '';
}

export function isProfilePhotoMissing(
  photoUrl: MentorProfileEvaluation['photoUrl'],
): boolean {
  return photoUrl === null || photoUrl.length === 0;
}

export function isProfessionalDescriptionMissing(
  aboutMe: MentorProfileEvaluation['aboutMe'],
): boolean {
  return normalizeProfileText(aboutMe).length === 0;
}
