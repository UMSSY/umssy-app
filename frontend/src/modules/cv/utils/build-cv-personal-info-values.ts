import { toPersonalInfoValues, type PersonalInfoValues, type ProfileResponse } from "@/modules/profile";
import { CV_PERSONAL_INFO_FIELDS } from "../constants/cv-apply.constants";
import type { CvContactField } from "../types/cv-contact-field.types";
import type { CvExtractedContact } from "../types/cv-extracted-contact.types";

export function buildCvPersonalInfoValues(
  profile: ProfileResponse,
  contact: CvExtractedContact,
  fields: readonly CvContactField[],
): PersonalInfoValues {
  return (fields ?? []).reduce<PersonalInfoValues>((values, field) => {
    const value = (contact?.[field] ?? "").trim();
    return value ? { ...values, [CV_PERSONAL_INFO_FIELDS[field]]: value } : values;
  }, toPersonalInfoValues(profile));
}
