import { EMAIL_PATTERN } from "@/shared/constants/validation.constants";

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
