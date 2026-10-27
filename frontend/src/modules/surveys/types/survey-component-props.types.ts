import type { ReactNode } from "react";
import type { BuilderOption, BuilderQuestion, SurveyBuilderState, SurveyFieldName, SurveyHeaderValues } from "./survey-builder.types";
import type { SurveyErrorMap, SurveyValidationError } from "./survey-validation.types";
import type {
  Career,
  CreateSurveyPayload,
  QuestionType,
  SurveyDetail,
  SurveyOptionStatistic,
  SurveyQuestionStatistic,
  SurveyStatus,
  SurveySummary,
} from "./survey.types";

export interface SurveyHeaderCardProps {
  values: SurveyHeaderValues;
  careers: Career[];
  isLoadingCareers: boolean;
  careersErrorMessage?: string;
  academicPeriods: string[];
  minDate: Date;
  errors: SurveyErrorMap;
  onFieldChange: (field: SurveyFieldName, value: string) => void;
}

export interface SurveyDateFieldProps {
  id: string;
  label: string;
  value: string;
  minDate: Date;
  error?: string;
  onChange: (value: string) => void;
}

export interface FieldErrorMessageProps {
  id: string;
  message?: string;
  className?: string;
}

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

export interface QuestionSummaryProps {
  question: BuilderQuestion;
  index: number;
}

export interface QuestionTypeSelectProps {
  id: string;
  value: QuestionType;
  onChange: (questionType: QuestionType) => void;
}

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

export interface OptionMarkerProps {
  questionType: QuestionType;
  className?: string;
}

export interface QuestionFloatingToolbarProps {
  onAddQuestion: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
}

export interface AddQuestionButtonProps {
  onClick: () => void;
}

export interface SurveyValidationAlertProps {
  errors: SurveyValidationError[];
}

export interface SurveyBuilderTopbarProps {
  title: string;
  isSaving: boolean;
  onCancel: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export interface PublishSurveyDialogProps {
  open: boolean;
  survey: SurveyBuilderState;
  careerTitle: string;
  isPublishing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export interface DiscardChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export interface SurveyPreviewDialogProps {
  open: boolean;
  survey: SurveyBuilderState;
  careerTitle: string;
  onOpenChange: (open: boolean) => void;
}

export interface PreviewQuestionProps {
  question: BuilderQuestion;
  index: number;
  isReadOnly?: boolean;
}

export interface SurveysTableProps {
  surveys: SurveySummary[];
  isLoading: boolean;
  hasError: boolean;
  emptyMessage?: string;
}

export interface SurveyRowActionsProps {
  survey: SurveySummary;
}

export interface SurveySummaryRowProps {
  label: string;
  children: ReactNode;
}

export interface RequiredMarkProps {
  className?: string;
}

export interface SurveyHorizontalBarsProps {
  options: SurveyOptionStatistic[];
  highlightedId?: string;
}

export interface SurveyQuestionResultCardProps {
  question: SurveyQuestionStatistic;
}


export interface SurveyAnalyticsViewProps {
  id: string;
}

export interface SurveyEditorProps {
  title: string;
  initialState?: SurveyBuilderState;
  isSaving: boolean;
  pendingStatus?: SurveyStatus;
  draftSavedMessage: string;
  onSave: (payload: CreateSurveyPayload) => Promise<unknown>;
}

export interface SurveyDetailViewProps {
  id: string;
}

export interface SurveyReadOnlyViewProps {
  survey: SurveyDetail;
}

export interface SurveyQuestionFieldOption {
  id: string;
  label: string;
}

export interface SurveyQuestionFieldQuestion {
  id: string;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  options: SurveyQuestionFieldOption[];
}

export interface SurveyQuestionFieldProps {
  question: SurveyQuestionFieldQuestion;
  index: number;
  idPrefix: string;
  selectedOptionIds?: string[];
  onChange?: (optionIds: string[]) => void;
  isReadOnly?: boolean;
  hint?: string;
  error?: string;
}

export interface AnswerSurveyViewProps {
  id: string;
}
