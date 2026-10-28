import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import type { SurveyValidationAlertProps } from "../types/survey-component-props.types";

export function SurveyValidationAlert({ errors }: SurveyValidationAlertProps) {
  if ((errors ?? []).length === 0) return null;

  return (
    <Alert
      id="survey-validation-alert"
      variant="destructive"
      className="rounded-lg border-danger/30 bg-danger/5 px-4 py-3 text-danger"
    >
      <CircleAlert aria-hidden="true" />
      <AlertTitle className="font-semibold">{SURVEY_MESSAGES.validationAlertTitle}</AlertTitle>
      <AlertDescription className="text-danger">
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-ink-soft">
          {errors.map((error) => (
            <li key={`${error.path}-${error.message}`}>
              {error.label}: {error.summary}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
