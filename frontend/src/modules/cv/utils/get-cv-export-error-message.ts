import { getHttpStatus } from "@/modules/profile";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import { CV_EXPORT_ERROR_MESSAGES_BY_STATUS } from "../constants/cv-export.constants";

export function getCvExportErrorMessage(error: unknown): string {
  const status = getHttpStatus(error);

  if (status === undefined) {
    return CV_ERROR_MESSAGES.generate;
  }

  return CV_EXPORT_ERROR_MESSAGES_BY_STATUS[status] ?? CV_ERROR_MESSAGES.generate;
}
