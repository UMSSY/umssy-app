import type { CvExtractionSection } from "../types/cv-extraction-section.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";

export function selectCvSelectionItem<K extends CvExtractionSection>(
  selection: CvExtractionSelection,
  section: K,
  item: CvExtractionSelection[K][number],
): CvExtractionSelection {
  const items: readonly (string | number)[] = selection[section] ?? [];
  return items.includes(item) ? selection : { ...selection, [section]: [...items, item] };
}
