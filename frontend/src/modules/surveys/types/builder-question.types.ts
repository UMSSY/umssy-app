import type { QuestionType } from "./question-type.types";
import type { BuilderOption } from "./builder-option.types";

export interface BuilderQuestion {
  id: string;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: BuilderOption[];
}
