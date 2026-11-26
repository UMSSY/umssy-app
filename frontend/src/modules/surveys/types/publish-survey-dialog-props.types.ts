import type { SurveyBuilderState } from "./survey-builder-state.types";

export interface PublishSurveyDialogProps {
  open: boolean;
  survey: SurveyBuilderState;
  careerTitle: string;
  isPublishing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
