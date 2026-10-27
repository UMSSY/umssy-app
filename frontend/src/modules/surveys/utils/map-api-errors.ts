import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_FIELD_LABELS } from "../constants/survey-messages.constants";
import type { SurveyValidationError } from "../types/survey-validation.types";

const QUESTION_PATH = /^questions\.(\d+)\.(statement|options)/;

interface ApiFieldError {
  field?: unknown;
  message?: unknown;
}

interface ApiErrorPayload {
  detail?: unknown;
  data?: unknown;
  errors?: unknown;
}

function normalizePath(field: string): string {
  const match = QUESTION_PATH.exec(field);
  return match ? `questions.${match[1]}.${match[2]}` : field;
}

function getLabel(path: string): string {
  const match = QUESTION_PATH.exec(path);
  if (match) return SURVEY_TEXT.questionLabel(Number(match[1]) + 1);
  return SURVEY_FIELD_LABELS[path as keyof typeof SURVEY_FIELD_LABELS] ?? SURVEY_TEXT.untitledSurvey;
}

function toError(field: string, message: string): SurveyValidationError {
  const path = normalizePath(field);
  return { path, label: getLabel(path), message, summary: message };
}

function isFieldError(value: unknown): value is { field: string; message: string } {
  const candidate = value as ApiFieldError | null;
  return typeof candidate?.field === "string" && typeof candidate?.message === "string";
}

export function mapApiErrors(error: unknown): SurveyValidationError[] {
  if (typeof error !== "object" || error === null) return [];
  const body = (error as { response?: { data?: ApiErrorPayload } }).response?.data;
  if (!body) return [];

  if (Array.isArray(body.errors)) {
    return body.errors.filter(isFieldError).map(({ field, message }) => toError(field, message));
  }

  const field = (body.data as ApiFieldError | null)?.field;
  if (typeof field === "string" && typeof body.detail === "string") {
    return [toError(field, body.detail)];
  }

  return [];
}
