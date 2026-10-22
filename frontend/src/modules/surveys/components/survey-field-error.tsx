import { CircleAlert } from "lucide-react";
import type { SurveyFieldErrorProps } from "../types/survey-field-error-props.types";

// Texto de error que aparece justo debajo del campo afectado.
export function SurveyFieldError({ id, message }: SurveyFieldErrorProps) {
  if (!message) return null;

  return (
    <p id={id} className="flex items-center gap-1.5 text-xs text-destructive">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
