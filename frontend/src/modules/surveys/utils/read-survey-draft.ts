import { readSurveyStorage } from "./survey-draft-storage";
import type { SurveyBuilderState } from "../types/survey-builder.types";

export async function readSurveyDraft(storageKey: string): Promise<SurveyBuilderState | undefined> {
  const draft = await readSurveyStorage<SurveyBuilderState>(storageKey);
  if (!draft || typeof draft !== "object" || !Array.isArray(draft.questions)) return undefined;

  return { ...draft, pendingFocus: null, isDirty: true };
}
