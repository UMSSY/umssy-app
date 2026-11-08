import { isApiError as isAxiosError } from "@/shared/services/api-client";
import { EDUCATION_FEEDBACK_MESSAGES } from "../constants/education-feedback.constants";
import { EDUCATION_CONFLICT_STATUS } from "../constants/education-http.constants";

export function getEducationSaveError(error: unknown): string | undefined {
  if (!isAxiosError(error) || error.response?.status !== EDUCATION_CONFLICT_STATUS) return undefined;
  const code: unknown = error.response?.data?.data?.code;
  if (code === "EDUCATION_DUPLICATE") return EDUCATION_FEEDBACK_MESSAGES.duplicate;
  if (code === "EDUCATION_WRITE_CONFLICT") return EDUCATION_FEEDBACK_MESSAGES.writeConflict;
  return undefined;
}
