import { PHONE_MAX_DIGITS, PHONE_MIN_DIGITS } from "../config/profile-validation.config";

// Allows an optional leading "+" followed by digits, spaces or hyphens.
const PHONE_PATTERN = /^\+?[\d\s-]+$/;

export function isValidPhone(phone: string): boolean {
  if (!PHONE_PATTERN.test(phone)) {
    return false;
  }

  const digitCount = phone.replace(/\D/g, "").length;
  return digitCount >= PHONE_MIN_DIGITS && digitCount <= PHONE_MAX_DIGITS;
}
