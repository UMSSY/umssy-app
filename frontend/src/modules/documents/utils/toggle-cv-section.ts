import type { CvExtractionSection } from "../types/cv-extraction-section.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { isCvSectionFullySelected } from "./is-cv-section-fully-selected";

export function toggleCvSection(
  selection: CvExtractionSelection,
  available: CvExtractionSelection,
  section: CvExtractionSection,
): CvExtractionSelection {
  const isFull = isCvSectionFullySelected<string | number>(selection[section], available[section]);
  return { ...selection, [section]: isFull ? [] : [...available[section]] };
}
