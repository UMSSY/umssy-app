import type { SurveyOptionResult } from "../types/survey.types";

// Opción más elegida, que el gráfico resalta. Ante un empate gana la primera; sin respuestas no se resalta nada.
export function getHighlightedOptionId(options: SurveyOptionResult[]): string | null {
  let top: SurveyOptionResult | null = null;
  for (const option of options) {
    if (!top || option.count > top.count) top = option;
  }
  return top && top.count > 0 ? top.id : null;
}
