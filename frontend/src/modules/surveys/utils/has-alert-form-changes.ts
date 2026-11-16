import type { SurveyAlertFormValues } from "../types/survey-alert-form-errors.types";

function hasSameIds(first: string[], second: string[]): boolean {
  return first.length === second.length && first.every((id) => second.includes(id));
}

export function hasAlertFormChanges(current: SurveyAlertFormValues, saved: SurveyAlertFormValues): boolean {
  return (
    current.enabled !== saved.enabled ||
    current.threshold.trim() !== saved.threshold.trim() ||
    !hasSameIds(current.questionIds ?? [], saved.questionIds ?? [])
  );
}
