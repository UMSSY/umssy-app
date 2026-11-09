import type { SurveyBuilderState } from "./survey-builder-state.types";
import type { CreateSurveyPayload } from "./create-survey-payload.types";
import type { SurveyStatus } from "./survey-status.types";

export interface SurveyEditorProps {
  title: string;
  initialState?: SurveyBuilderState;
  autosaveKey?: string;
  isSaving: boolean;
  pendingStatus?: SurveyStatus;
  draftSavedMessage: string;
  onSave: (payload: CreateSurveyPayload) => Promise<unknown>;
}
