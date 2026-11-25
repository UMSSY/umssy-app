import { validatePersonalInfo, type ProfileResponse } from "@/modules/profile";
import { CV_PERSONAL_INFO_FIELDS } from "../constants/cv-apply.constants";
import { CV_CONTACT_FIELDS } from "../constants/cv-extraction.constants";
import type { CvContactErrors } from "../types/cv-contact-errors.types";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { buildCvPersonalInfoValues } from "./build-cv-personal-info-values";

export function getCvContactErrors(
  profile: ProfileResponse | null,
  extraction: CvExtraction | null,
  selection: CvExtractionSelection,
): CvContactErrors {
  if (!profile || !extraction || (selection.contact ?? []).length === 0) return {};
  const errors = validatePersonalInfo(buildCvPersonalInfoValues(profile, extraction.contact, selection.contact));
  return CV_CONTACT_FIELDS.reduce<CvContactErrors>((current, field) => {
    const error = errors[CV_PERSONAL_INFO_FIELDS[field]];
    return error ? { ...current, [field]: error } : current;
  }, {});
}
