import { CV_CONTACT_FIELDS, CV_PRESENTATION_INDEX } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { hasCvText } from "./has-cv-text";

const toIndexes = (items: readonly unknown[] | null | undefined): number[] => (items ?? []).map((_, index) => index);

export function buildDefaultCvSelection(extraction: CvExtraction): CvExtractionSelection {
  return {
    contact: CV_CONTACT_FIELDS.filter((field) => hasCvText(extraction.contact?.[field])),
    presentation: hasCvText(extraction.presentation?.aboutMe) ? [CV_PRESENTATION_INDEX] : [],
    education: toIndexes(extraction.educations),
    experience: toIndexes(extraction.workExperiences),
    skills: toIndexes(extraction.skills),
  };
}
