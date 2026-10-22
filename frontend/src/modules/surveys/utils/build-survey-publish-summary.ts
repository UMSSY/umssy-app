import { ALL_CAREERS_LABEL } from "../constants/survey-form.constants";
import type { SurveyPublishSummary } from "../types/survey-publish-summary.types";
import type { SurveyInput } from "../types/survey.types";

// Convierte "2026-11-03" en "03/11/2026" sin pasar por Date, para no correr el día por la zona horaria.
export function formatSurveyDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "-";
}

// Datos del bloque informativo del modal "¿Publicar encuesta?".
export function buildSurveyPublishSummary(input: SurveyInput): SurveyPublishSummary {
  const requiredCount = input.questions.filter((question) => question.isRequired).length;
  const requiredLabel = requiredCount === 1 ? "obligatoria" : "obligatorias";

  return {
    title: input.title.trim(),
    audience: input.targetCareer ?? ALL_CAREERS_LABEL,
    validity: `${formatSurveyDate(input.opensAt)} - ${formatSurveyDate(input.closesAt)}`,
    questions: `${input.questions.length} (${requiredCount} ${requiredLabel})`,
  };
}
