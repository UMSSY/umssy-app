import type { SurveyQuestionFieldQuestion } from "./survey-question-field-question.types";
import type { SurveyQuestionFieldVariant } from "./survey-question-field-variant.types";

export interface SurveyQuestionFieldProps {
  question: SurveyQuestionFieldQuestion;
  index: number;
  idPrefix: string;
  selectedOptionIds?: string[];
  onChange?: (optionIds: string[]) => void;
  isReadOnly?: boolean;
  hint?: string;
  error?: string;
  variant?: SurveyQuestionFieldVariant;
}
