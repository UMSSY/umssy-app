import type { VariationShift } from './variation-shift.type.js';

export interface SurveyVariationEvaluationResult {
  hasShifts: boolean;
  shifts: VariationShift[];
  currentPeriod: string;
  previousPeriod: string;
  summaryText: string;
}
