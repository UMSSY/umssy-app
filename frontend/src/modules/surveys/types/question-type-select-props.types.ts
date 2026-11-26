import type { QuestionType } from "./question-type.types";

export interface QuestionTypeSelectProps {
  id: string;
  value: QuestionType;
  onChange: (questionType: QuestionType) => void;
}
