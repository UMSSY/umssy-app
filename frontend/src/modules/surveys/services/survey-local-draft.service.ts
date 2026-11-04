import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "@/shared/services/storage/browser-local-storage";
import { SURVEY_LOCAL_DRAFT_STORAGE_KEY } from "../constants/survey-builder.constants";
import type { BuilderOption, BuilderQuestion, SurveyBuilderState, SurveyLocalDraft } from "../types/survey-builder.types";
import { isQuestionType } from "../utils/is-question-type";

const HEADER_FIELDS = ["title", "description", "careerId", "academicPeriod", "opensAt", "closesAt", "savedAt"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBuilderOption(value: unknown): value is BuilderOption {
  return isRecord(value) && typeof value.id === "string" && typeof value.label === "string";
}

function isBuilderQuestion(value: unknown): value is BuilderQuestion {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.statement === "string" &&
    isQuestionType(value.type) &&
    typeof value.isRequired === "boolean" &&
    Array.isArray(value.options) &&
    value.options.every(isBuilderOption)
  );
}

function isSurveyLocalDraft(value: unknown): value is SurveyLocalDraft {
  return (
    isRecord(value) &&
    HEADER_FIELDS.every((field) => typeof value[field] === "string") &&
    Array.isArray(value.questions) &&
    value.questions.every(isBuilderQuestion)
  );
}

export function saveSurveyLocalDraft(state: SurveyBuilderState, now: Date = new Date()): void {
  const draft: SurveyLocalDraft = {
    title: state.title,
    description: state.description,
    careerId: state.careerId,
    academicPeriod: state.academicPeriod,
    opensAt: state.opensAt,
    closesAt: state.closesAt,
    questions: state.questions,
    savedAt: now.toISOString(),
  };
  writeLocalStorage(SURVEY_LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadSurveyLocalDraft(): SurveyLocalDraft | null {
  const stored = readLocalStorage(SURVEY_LOCAL_DRAFT_STORAGE_KEY);
  if (stored === null) return null;

  try {
    const draft: unknown = JSON.parse(stored);
    if (isSurveyLocalDraft(draft)) return draft;
  } catch {
    // Un valor corrupto se descarta igual que uno con forma inválida.
  }

  removeLocalStorage(SURVEY_LOCAL_DRAFT_STORAGE_KEY);
  return null;
}

export function clearSurveyLocalDraft(): void {
  removeLocalStorage(SURVEY_LOCAL_DRAFT_STORAGE_KEY);
}
