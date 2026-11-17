import type { CvApplyResult } from "../types/cv-apply-result.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";

export function removeAppliedCvSelection(
  selection: CvExtractionSelection,
  results: readonly CvApplyResult[],
): CvExtractionSelection {
  return (results ?? [])
    .filter(({ isApplied }) => isApplied)
    .reduce<CvExtractionSelection>((current, { task }) => {
      const items: readonly (string | number)[] = current[task.section] ?? [];
      return { ...current, [task.section]: items.filter((item) => !task.items.includes(item)) };
    }, selection);
}
