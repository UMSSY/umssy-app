import { getRegistrationErrorMessage, REGISTRATION_ERROR_MESSAGES } from "@/modules/event-registrations";
import { parseApiError } from "@/shared/utils/parse-api-error";

export function getHistoryErrorMessage(cause: unknown): string {
  const parsed = parseApiError(cause);
  if (parsed && Object.hasOwn(REGISTRATION_ERROR_MESSAGES, parsed.code)) {
    return getRegistrationErrorMessage(cause);
  }
  return "No fue posible cargar tu historial. Inténtalo de nuevo.";
}
