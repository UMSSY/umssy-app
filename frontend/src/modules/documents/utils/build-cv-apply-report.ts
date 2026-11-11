import type { CvApplyReport } from "../types/cv-apply-report.types";
import type { CvApplyResult } from "../types/cv-apply-result.types";

export function buildCvApplyReport(results: readonly CvApplyResult[]): CvApplyReport {
  return {
    applied: (results ?? []).filter(({ isApplied }) => isApplied).map(({ task }) => task.label),
    failed: (results ?? []).filter(({ isApplied }) => !isApplied).map(({ task }) => task.label),
  };
}
