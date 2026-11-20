import type { BuilderQuestion } from "./builder-question.types";
import type { SurveyHeaderValues } from "./survey-header-values.types";
import type { PendingFocus } from "./pending-focus.types";

export interface SurveyBuilderState extends SurveyHeaderValues {
  questions: BuilderQuestion[];
  activeQuestionId: string | null;
  pendingFocus: PendingFocus | null;
  isDirty: boolean;
}
