import type { SurveyPublishSummary } from "./survey-publish-summary.types";

export interface SurveyPublishDialogProps {
  open: boolean;
  summary: SurveyPublishSummary;
  isPublishing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
