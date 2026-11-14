import type { CvExtractionSection } from "../types/cv-extraction-section.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { toggleListItem } from "./toggle-list-item";

export function toggleCvSelectionItem<K extends CvExtractionSection>(
  selection: CvExtractionSelection,
  section: K,
  item: CvExtractionSelection[K][number],
): CvExtractionSelection {
  const items: readonly (string | number)[] = selection[section] ?? [];
  return { ...selection, [section]: toggleListItem(items, item) };
}
