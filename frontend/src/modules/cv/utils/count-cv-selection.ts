import { CV_EXTRACTION_SECTIONS } from "../constants/cv-extraction.constants";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";

export function countCvSelection(selection: CvExtractionSelection): number {
  return CV_EXTRACTION_SECTIONS.reduce((total, section) => total + (selection[section] ?? []).length, 0);
}
