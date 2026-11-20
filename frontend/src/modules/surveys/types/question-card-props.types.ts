import type { BuilderQuestion } from "./builder-question.types";
import type { SurveyErrorMap } from "./survey-error-map.types";
import type { QuestionType } from "./question-type.types";

export interface QuestionCardProps {
  question: BuilderQuestion;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  shouldFocusStatement: boolean;
  focusOptionId?: string;
  errors: SurveyErrorMap;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onActivate: (questionId: string) => void;
  onStatementChange: (questionId: string, statement: string) => void;
  onTypeChange: (questionId: string, questionType: QuestionType) => void;
  onToggleRequired: (questionId: string) => void;
  onAddOption: (questionId: string) => void;
  onRemoveOption: (questionId: string, optionId: string) => void;
  onOptionChange: (questionId: string, optionId: string, label: string) => void;
  onDuplicate: (questionId: string) => void;
  onRemove: (questionId: string) => void;
  onAddQuestionAfter: (index: number) => void;
  onPreview: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onFocusHandled: () => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
}
