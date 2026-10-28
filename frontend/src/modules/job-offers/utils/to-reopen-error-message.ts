import { isApiError } from "@/shared/services/api-client";
import { REOPEN_JOB_OFFER_TEXT } from "../constants/job-offers.constants";

const CONFLICT_STATUS = 409;

// Un 409 indica que la vacante cambió de estado antes de confirmar (HU6-27).
export function toReopenErrorMessage(error: unknown): string {
  if (isApiError(error) && error.response?.status === CONFLICT_STATUS) {
    return REOPEN_JOB_OFFER_TEXT.notReopenable;
  }
  return REOPEN_JOB_OFFER_TEXT.error;
}
