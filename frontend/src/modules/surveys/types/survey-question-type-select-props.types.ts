import type { SurveyQuestionType } from "./survey.types";

export interface SurveyQuestionTypeSelectProps {
  value: SurveyQuestionType;
  questionNumber: number;
  onChange: (type: SurveyQuestionType) => void;
}
