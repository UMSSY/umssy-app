import { CV_PRESENTATION_INDEX } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { hasCvText } from "./has-cv-text";

export function isCvHeadlineMissing(extraction: CvExtraction | null, selection: CvExtractionSelection): boolean {
  return (
    extraction !== null &&
    selection.presentation.includes(CV_PRESENTATION_INDEX) &&
    !hasCvText(extraction.presentation?.headline)
  );
}
