import { CONFLICT_STATUS } from "@/shared/constants/http.constants";
import { isApiError } from "@/shared/services/api-client";
import { REOPEN_JOB_OFFER_TEXT } from "../constants/job-offers.constants";

export function toReopenErrorMessage(error: unknown): string {
  if (isApiError(error) && error.response?.status === CONFLICT_STATUS) {
    return REOPEN_JOB_OFFER_TEXT.notReopenable;
  }
  return REOPEN_JOB_OFFER_TEXT.error;
}
