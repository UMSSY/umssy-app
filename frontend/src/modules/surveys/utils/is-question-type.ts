import { QUESTION_TYPE_OPTIONS } from "../constants/survey-builder.constants";
import type { QuestionType } from "../types/survey.types";

export function isQuestionType(value: unknown): value is QuestionType {
  return QUESTION_TYPE_OPTIONS.some((option) => option.value === value);
}
