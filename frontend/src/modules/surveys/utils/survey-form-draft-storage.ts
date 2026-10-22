import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "@/shared/services/storage/browser-local-storage";
import { SURVEY_FORM_DRAFT_STORAGE_KEY } from "../constants/surveys.constants";
import type { SurveyFormDraft } from "../types/survey-form-draft.types";
import type { SurveyInput } from "../types/survey.types";

function isSurveyFormDraft(value: unknown): value is SurveyFormDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Partial<SurveyFormDraft>;
  return typeof draft.savedAt === "string" && typeof draft.values?.title === "string" && Array.isArray(draft.values.questions);
}

export function readSurveyFormDraft(): SurveyFormDraft | null {
  const stored = readLocalStorage(SURVEY_FORM_DRAFT_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    return isSurveyFormDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSurveyFormDraft(surveyId: string | null, values: SurveyInput, now = new Date()): void {
  const draft: SurveyFormDraft = { surveyId, values, savedAt: now.toISOString() };
  writeLocalStorage(SURVEY_FORM_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearSurveyFormDraft(): void {
  removeLocalStorage(SURVEY_FORM_DRAFT_STORAGE_KEY);
}
