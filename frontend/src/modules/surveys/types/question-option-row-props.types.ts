import type { BuilderOption } from "./builder-option.types";
import type { QuestionType } from "./question-type.types";

export interface QuestionOptionRowProps {
  option: BuilderOption;
  index: number;
  questionType: QuestionType;
  canRemove: boolean;
  shouldFocus: boolean;
  isInvalid: boolean;
  onChange: (label: string) => void;
  onRemove: () => void;
  onFocusHandled: () => void;
}
