import { parseApiError } from "@/shared/utils/parse-api-error";
import { DEFAULT_REGISTRATION_ERROR_MESSAGE, REGISTRATION_ERROR_MESSAGES } from "../constants/registration-errors.constants";
import type { RegistrationErrorCode } from "../types/registration-error-code.types";

function isRegistrationErrorCode(code: string): code is RegistrationErrorCode {
  return Object.hasOwn(REGISTRATION_ERROR_MESSAGES, code);
}

export function getRegistrationErrorMessage(error: unknown): string {
  const parsed = parseApiError(error);
  return parsed && isRegistrationErrorCode(parsed.code)
    ? REGISTRATION_ERROR_MESSAGES[parsed.code]
    : DEFAULT_REGISTRATION_ERROR_MESSAGE;
}
