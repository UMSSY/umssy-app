import { PROFILE_VALIDATION_MESSAGES } from "../config/profile-validation.config";
import type { PresentationErrors } from "../types/presentation-errors.types";
import type { PresentationValues } from "../types/presentation-values.types";

// Expects trimmed values. "interestedOpportunities" is optional.
export function validatePresentation(values: PresentationValues): PresentationErrors {
  const errors: PresentationErrors = {};

  if (!values.headline) {
    errors.headline = PROFILE_VALIDATION_MESSAGES.required;
  }

  if (!values.aboutMe) {
    errors.aboutMe = PROFILE_VALIDATION_MESSAGES.required;
  }

  return errors;
}
