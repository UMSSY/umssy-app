import {
  CV_EXTRACTION_ERROR_MESSAGES,
  CV_EXTRACTION_ERROR_MESSAGES_BY_CODE,
  CV_EXTRACTION_NOT_FOUND_CODE,
  CV_EXTRACTION_RETRYABLE_CODES,
  CV_EXTRACTION_RETRYABLE_STATUSES,
  CV_NOT_FOUND_STATUS,
  CV_SERVER_ERROR_MIN_STATUS,
  CV_UNAUTHORIZED_STATUS,
} from "../constants/cv-error-messages.constants";
import type { CvExtractionError } from "../types/cv-extraction-error.types";
import type { CvExtractionErrorResponse } from "../types/cv-extraction-error-response.types";
import { getHttpStatus } from "@/modules/profile";

function getErrorCode(error: unknown): string | null {
  const code = (error as CvExtractionErrorResponse | null)?.response?.data?.code;
  return typeof code === "string" ? code : null;
}

export function getCvExtractionError(error: unknown): CvExtractionError {
  const status = getHttpStatus(error);

  if (status === undefined) {
    return { message: CV_EXTRACTION_ERROR_MESSAGES.network, isRetryable: true };
  }

  const code = getErrorCode(error) ?? (status === CV_NOT_FOUND_STATUS ? CV_EXTRACTION_NOT_FOUND_CODE : null);
  const messageByCode = code ? CV_EXTRACTION_ERROR_MESSAGES_BY_CODE[code] : undefined;

  if (code && messageByCode) {
    return { message: messageByCode, isRetryable: CV_EXTRACTION_RETRYABLE_CODES.includes(code) };
  }

  if (status === CV_UNAUTHORIZED_STATUS) {
    return { message: CV_EXTRACTION_ERROR_MESSAGES.session, isRetryable: false };
  }

  if (status >= CV_SERVER_ERROR_MIN_STATUS || CV_EXTRACTION_RETRYABLE_STATUSES.includes(status)) {
    return { message: CV_EXTRACTION_ERROR_MESSAGES.server, isRetryable: true };
  }

  return { message: CV_EXTRACTION_ERROR_MESSAGES.unknown, isRetryable: false };
}
