import type { QuestionType } from "./question-type.types";
import type { SurveyDetailOption } from "./survey-detail-option.types";

export interface SurveyDetailQuestion {
  id: string;
  position: number;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: SurveyDetailOption[];
}
