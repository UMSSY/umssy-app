import type { QuestionType } from "./question-type.types";
import type { CreateSurveyOptionPayload } from "./create-survey-option-payload.types";

export interface CreateSurveyQuestionPayload {
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: CreateSurveyOptionPayload[];
}
