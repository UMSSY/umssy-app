import type { QuestionType } from "./question-type.types";
import type { SurveyFieldName } from "./survey-field-name.types";

export type SurveyBuilderAction =
  | { type: "updateField"; field: SurveyFieldName; value: string }
  | { type: "addQuestion"; afterIndex?: number }
  | { type: "duplicateQuestion"; questionId: string }
  | { type: "removeQuestion"; questionId: string }
  | { type: "moveQuestion"; fromIndex: number; toIndex: number }
  | { type: "setActiveQuestion"; questionId: string | null }
  | { type: "updateStatement"; questionId: string; statement: string }
  | { type: "changeType"; questionId: string; questionType: QuestionType }
  | { type: "toggleRequired"; questionId: string }
  | { type: "addOption"; questionId: string }
  | { type: "removeOption"; questionId: string; optionId: string }
  | {
      type: "updateOption";
      questionId: string;
      optionId: string;
      label: string;
    }
  | { type: "clearPendingFocus" }
  | { type: "markSaved" };
