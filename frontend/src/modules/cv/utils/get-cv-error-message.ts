import { CV_ERROR_MESSAGES_BY_STATUS } from "../constants/cv-error-messages.constants";
import type { CvErrorResponse } from "../types/cv-error-response.types";
import { getHttpStatus } from "@/modules/profile";

function getErrorCode(error: unknown): unknown {
  return (error as CvErrorResponse).response?.data?.data?.code;
}

export function getCvErrorMessage(error: unknown, fallbackMessage: string): string {
  const status = getHttpStatus(error);

  if (status === undefined) {
    return fallbackMessage;
  }

  if (getErrorCode(error) === "CORRUPTED_FILE") {
    return "El archivo está dañado o incompleto. Selecciona otro PDF.";
  }

  return CV_ERROR_MESSAGES_BY_STATUS[status] ?? fallbackMessage;
}
