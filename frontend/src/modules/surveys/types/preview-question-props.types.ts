import type { BuilderQuestion } from "./builder-question.types";

export interface PreviewQuestionProps {
  question: BuilderQuestion;
  index: number;
  isReadOnly?: boolean;
}
