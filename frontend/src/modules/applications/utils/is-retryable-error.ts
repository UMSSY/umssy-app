import { SERVER_ERROR_STATUS } from "@/shared/constants/http.constants";
import { isApiError } from "@/shared/services/api-client";

export function isRetryableError(error: unknown): boolean {
  if (!isApiError(error) || !error.response) return true;
  return error.response.status >= SERVER_ERROR_STATUS;
}
