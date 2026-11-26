import type { QuestionType } from "./question-type.types";
import type { SurveyQuestionFieldOption } from "./survey-question-field-option.types";

export interface SurveyQuestionFieldQuestion {
  id: string;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: SurveyQuestionFieldOption[];
}
