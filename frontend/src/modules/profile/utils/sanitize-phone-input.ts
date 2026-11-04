import { PHONE_MAX_DIGITS } from "../constants/profile-validation.constants";

const DIGIT_PATTERN = /\d/;
// The hint offers digits plus +, spaces and hyphens, so anything else is dropped while typing
const ALLOWED_PATTERN = /[\d +-]/;

export function sanitizePhoneInput(value: string): string {
  let digitCount = 0;
  let sanitized = "";

  for (const character of value ?? "") {
    if (!ALLOWED_PATTERN.test(character)) {
      continue;
    }
    if (DIGIT_PATTERN.test(character)) {
      if (digitCount === PHONE_MAX_DIGITS) {
        continue;
      }
      digitCount += 1;
    }
    sanitized += character;
  }

  return sanitized;
}
