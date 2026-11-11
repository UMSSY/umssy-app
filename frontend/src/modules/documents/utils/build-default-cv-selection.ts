import { CV_CONTACT_FIELDS } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { hasCvText } from "./has-cv-text";

export function buildDefaultCvSelection(extraction: CvExtraction): CvExtractionSelection {
  return {
    contactFields: CV_CONTACT_FIELDS.filter((field) => hasCvText(extraction.contact[field])),
    educations: (extraction.educations ?? []).map((_, index) => index),
    workExperiences: (extraction.workExperiences ?? []).map((_, index) => index),
  };
}
