import type { SurveyOptionResult } from "./survey.types";

export interface SurveyResultChartProps {
  options: SurveyOptionResult[];
  // Opción más elegida, que se resalta en rojo; null si nadie respondió.
  highlightedId: string | null;
  // "respuestas" o "selecciones", según el tipo de pregunta.
  unit: string;
}
