import { SURVEY_PUBLISHED_NO_CHANGES_TEXT } from '../constants/survey-participation.constants.js';
import type { VariationShift } from '../types/variation-shift.type.js';

export function buildSurveyPublishedChange(
  shifts: VariationShift[],
  previousPeriod: string,
  currentPeriod: string,
): string {
  if (shifts.length === 0 || !previousPeriod)
    return SURVEY_PUBLISHED_NO_CHANGES_TEXT;

  const lines = [`Cambios entre ${previousPeriod} y ${currentPeriod}:`];
  for (const shift of shifts) {
    const arrow = shift.direction === 'up' ? '↑' : '↓';
    lines.push(
      `• «${shift.questionStatement}» - ${shift.optionLabel}: ${shift.previousPercentage}% -> ${shift.currentPercentage}% ${arrow}`,
    );
  }
  return lines.join('\n');
}
