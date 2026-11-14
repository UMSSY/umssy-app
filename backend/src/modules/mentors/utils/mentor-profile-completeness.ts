import type { MentorProfileEvaluation } from '../types/mentor-profile-evaluation.types.js';

/** Normalizes text for evaluation without changing the persisted profile. */
export function normalizeProfileText(value: string | null): string {
  return value?.trim() ?? '';
}

export function isProfilePhotoMissing(
  photoUrl: MentorProfileEvaluation['photoUrl'] | number,
): boolean {
  return (
    photoUrl === null ||
    (typeof photoUrl === 'number' ? photoUrl : photoUrl.length) === 0
  );
}

export function isProfessionalDescriptionMissing(
  aboutMe: MentorProfileEvaluation['aboutMe'],
): boolean {
  return normalizeProfileText(aboutMe).length === 0;
}

export function isMentorSpecialtyMissing(
  technicalAreas: MentorProfileEvaluation['mentorTechnicalAreas'] | boolean,
): boolean {
  return typeof technicalAreas === 'boolean'
    ? !technicalAreas
    : technicalAreas.length === 0;
}

export function isWorkExperienceMissing(
  workExperiences: MentorProfileEvaluation['workExperiences'] | boolean,
): boolean {
  return typeof workExperiences === 'boolean'
    ? !workExperiences
    : workExperiences.length === 0;
}
