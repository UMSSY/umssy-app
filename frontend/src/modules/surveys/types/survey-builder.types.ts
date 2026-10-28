import type { QuestionType } from "./survey.types";

export interface BuilderOption {
  id: string;
  label: string;
}

export interface BuilderQuestion {
  id: string;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: BuilderOption[];
}

export type SurveyFieldName = "title" | "description" | "careerId" | "academicPeriod" | "opensAt" | "closesAt";

export interface SurveyHeaderValues {
  title: string;
  description: string;
  careerId: string;
  academicPeriod: string;
  opensAt: string;
  closesAt: string;
}

export interface PendingFocus {
  questionId: string;
  optionId?: string;
}

export interface SurveyBuilderState extends SurveyHeaderValues {
  questions: BuilderQuestion[];
  activeQuestionId: string | null;
  pendingFocus: PendingFocus | null;
  isDirty: boolean;
}

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
  | { type: "updateOption"; questionId: string; optionId: string; label: string }
  | { type: "clearPendingFocus" }
  | { type: "markSaved" };
