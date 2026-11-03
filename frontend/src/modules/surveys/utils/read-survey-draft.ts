import { readLocalStorage } from "@/shared/utils/local-storage";
import type { SurveyBuilderState } from "../types/survey-builder.types";

export function readSurveyDraft(storageKey: string): SurveyBuilderState | undefined {
  const draft = readLocalStorage<SurveyBuilderState>(storageKey);
  if (!draft || typeof draft !== "object" || !Array.isArray(draft.questions)) return undefined;

  return { ...draft, pendingFocus: null, isDirty: true };
}
