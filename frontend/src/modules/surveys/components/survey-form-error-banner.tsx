import { CircleAlert } from "lucide-react";
import { SURVEY_SAVE_MESSAGES } from "../constants/survey-form.constants";
import type { SurveyFormErrorBannerProps } from "../types/survey-form-error-banner-props.types";

// Lista todos los errores encontrados al intentar guardar o publicar.
export function SurveyFormErrorBanner({ errors }: SurveyFormErrorBannerProps) {
  if (errors.length === 0) return null;

  return (
    <section role="alert" className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-destructive">{SURVEY_SAVE_MESSAGES.errorBannerTitle}</p>
        <ul className="list-disc pl-5 text-sm text-ink-soft">
          {errors.map((error) => (
            <li key={`${error.field}-${error.summary}`}>{error.summary}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
