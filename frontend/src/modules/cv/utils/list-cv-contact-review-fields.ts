import { CV_CONTACT_FIELDS } from "../constants/cv-extraction.constants";
import type { CvContactErrors } from "../types/cv-contact-errors.types";
import type { CvContactField } from "../types/cv-contact-field.types";

export function listCvContactReviewFields(
  detected: readonly CvContactField[] | null | undefined,
  errors: CvContactErrors | null | undefined,
): CvContactField[] {
  return CV_CONTACT_FIELDS.filter((field) => (detected ?? []).includes(field) || Boolean(errors?.[field]));
}
