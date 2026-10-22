import type { SurveyFormQuestion } from "./survey-form.types";
import type { SurveyQuestionInput } from "./survey.types";

export interface SurveyQuestionCardErrors {
  text?: string;
  options?: string;
}

export interface SurveyQuestionCardProps {
  question: SurveyFormQuestion;
  index: number;
  isActive: boolean;
  errors: SurveyQuestionCardErrors;
  canRemove: boolean;
  canAddQuestion: boolean;
  onActivate: () => void;
  onChange: (changes: Partial<SurveyQuestionInput>) => void;
  onAddOption: () => void;
  onUpdateOption: (index: number, text: string) => void;
  onRemoveOption: (index: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onAddQuestion: () => void;
  onPreview: () => void;
}
