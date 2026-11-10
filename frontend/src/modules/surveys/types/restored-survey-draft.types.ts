import type { SurveyBuilderState } from "./survey-builder-state.types";

export interface RestoredSurveyDraft {
  surveyId: string;
  draft?: SurveyBuilderState;
}
