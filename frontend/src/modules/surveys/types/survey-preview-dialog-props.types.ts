import type { SurveyFormValues } from "./survey-form.types";

export interface SurveyPreviewDialogProps {
  open: boolean;
  values: SurveyFormValues;
  onOpenChange: (open: boolean) => void;
}
