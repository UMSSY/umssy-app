import { PHONE_MAX_DIGITS } from "../constants/profile-validation.constants";
import { PHONE_PATTERN } from "../constants/validation.constants";

export function isValidPhone(phone: string): boolean {
  if (!PHONE_PATTERN.test(phone)) {
    return false;
  }

  const digitCount = phone.replace(/\D/g, "").length;
  return digitCount >= 7 && digitCount <= PHONE_MAX_DIGITS;
}
