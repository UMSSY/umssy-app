import type {
  PersonalInfoValues,
  PresentationValues,
  ProfileTab,
  UserProfile,
} from "../types/profile.types";

const PROFILE_TABS: ProfileTab[] = ["personal", "presentation", "trajectory", "documents"];

export function parseProfileTab(value: string | string[] | undefined): ProfileTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return PROFILE_TABS.find((item) => item === tab) ?? "personal";
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function getInitials(firstName: string, lastName: string): string {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`;
  return initials.toUpperCase() || "?";
}

export function toPersonalInfoValues(profile: UserProfile): PersonalInfoValues {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    cityId: profile.city?.id ?? "",
    phone: profile.phone ?? "",
    personalEmail: profile.personalEmail ?? "",
  };
}

export function toPresentationValues(profile: UserProfile): PresentationValues {
  return {
    headline: profile.headline ?? "",
    aboutMe: profile.aboutMe ?? "",
    interestedOpportunities: profile.interestedOpportunities ?? "",
  };
}

export function trimValues<T extends object>(values: T): T {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]),
  ) as T;
}
