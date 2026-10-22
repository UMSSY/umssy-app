import { SURVEY_OPTION_ICONS } from "../constants/survey-question-icons.constants";
import type { SurveyOptionMarkerProps } from "../types/survey-option-marker-props.types";

// Círculo (opción única), cuadrado (opción múltiple) o número (lista desplegable) a la izquierda de cada opción.
export function SurveyOptionMarker({ type, index }: SurveyOptionMarkerProps) {
  if (type === "DROPDOWN") {
    return <span className="w-5 shrink-0 text-right text-sm text-text-secondary tabular-nums">{index + 1}.</span>;
  }

  const Icon = SURVEY_OPTION_ICONS[type];
  return <Icon className="size-5 shrink-0 text-border-strong" aria-hidden="true" />;
}
