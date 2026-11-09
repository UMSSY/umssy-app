import type { SurveyBuilderState } from "../types/survey-builder-state.types";

export function createSurveyDraftFingerprint(state: SurveyBuilderState): string {
  return JSON.stringify({ ...state, activeQuestionId: null, pendingFocus: null, isDirty: false });
}
