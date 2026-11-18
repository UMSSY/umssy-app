import { FORBIDDEN_STATUS } from "@/shared/constants/http.constants";
import { isApiError } from "@/shared/services/api-client";
import { APPLICATION_MESSAGES } from "../constants/application.constants";

export function getContactErrorMessage(error: unknown): string {
  if (!isApiError(error)) return APPLICATION_MESSAGES.contactError;
  if (!error.response) return APPLICATION_MESSAGES.offline;
  if (error.response.status === FORBIDDEN_STATUS) return APPLICATION_MESSAGES.contactRestricted;
  return APPLICATION_MESSAGES.contactError;
}
