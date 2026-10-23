import { SURVEY_TREND_MIN_RESPONSES } from "../constants/survey-analytics.constants";
import type { SurveyQuestionResult } from "../types/survey.types";
import { formatOptionPercentage } from "./format-survey-metrics";

// Frase descriptiva del bloque "Tendencia". Sirve para cualquier pregunta porque se arma
// con los datos y no con el contenido. Devuelve null si todavía hay pocas respuestas.
export function buildQuestionTrend(question: SurveyQuestionResult): string | null {
  if (question.answeredBy < SURVEY_TREND_MIN_RESPONSES || question.totalSelections === 0) return null;

  const ranked = [...question.options].sort((first, second) => second.count - first.count);
  const [top, second] = ranked;
  const unit = question.type === "MULTIPLE_CHOICE" ? "selecciones" : "respuestas";

  if (second && second.count === top.count) {
    const tied = ranked.filter((option) => option.count === top.count).map((option) => `«${option.text}»`);
    return `Hay un empate entre ${tied.join(", ")} con ${formatOptionPercentage(top.percentage)} cada una.`;
  }

  const lead = `La opción más elegida es «${top.text}» con ${formatOptionPercentage(top.percentage)} (${top.count} de ${question.totalSelections} ${unit}).`;
  if (!second || second.count === 0) return lead;
  return `${lead} Le sigue «${second.text}» con ${formatOptionPercentage(second.percentage)}.`;
}
