import { isApiError } from "@/shared/services/api-client";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { SURVEY_SAVE_MESSAGES } from "../constants/survey-form.constants";

const NO_CONNECTION_STATUSES = new Set([503, 504]);
const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

export function getSurveySaveErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.code && TIMEOUT_CODES.has(error.code)) return SURVEY_SAVE_MESSAGES.timeout;
    // Sin respuesta significa que la petición no llegó al servidor (sin internet o servidor caído).
    if (!error.response || NO_CONNECTION_STATUSES.has(error.response.status)) return SURVEY_SAVE_MESSAGES.noConnection;
  }
  return getApiErrorDetail(error) ?? SURVEY_SAVE_MESSAGES.fallback;
}
