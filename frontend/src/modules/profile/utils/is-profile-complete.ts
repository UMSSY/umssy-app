import type { ProfileSummary } from "../types/profile-summary.types";

// A profile is complete when every required field of the personal info and presentation forms has a value.
export function isProfileComplete(profile: ProfileSummary): boolean {
  const requiredValues = [
    profile.fullName,
    profile.headline,
    profile.city,
    profile.phone,
    profile.personalEmail,
    profile.aboutMe,
  ];

  return requiredValues.every((value) => value.trim().length > 0);
}
