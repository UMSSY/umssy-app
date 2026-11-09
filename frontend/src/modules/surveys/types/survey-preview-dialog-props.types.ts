import type { SurveyBuilderState } from "./survey-builder-state.types";

export interface SurveyPreviewDialogProps {
  open: boolean;
  survey: SurveyBuilderState;
  careerTitle: string;
  onOpenChange: (open: boolean) => void;
}
