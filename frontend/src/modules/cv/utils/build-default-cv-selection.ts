import { CV_CONTACT_FIELDS, CV_PRESENTATION_INDEX } from "../constants/cv-extraction.constants";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionMatches } from "../types/cv-extraction-matches.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import type { CvRecordMatch } from "../types/cv-record-match.types";
import { hasCvText } from "./has-cv-text";

const toIndexes = (items: readonly unknown[] | null | undefined): number[] => (items ?? []).map((_, index) => index);

const toPendingIndexes = (
  items: readonly unknown[] | null | undefined,
  matches: readonly CvRecordMatch<unknown>[] | null | undefined,
): number[] => toIndexes(items).filter((index) => matches?.[index]?.status !== "same");

export function buildDefaultCvSelection(
  extraction: CvExtraction,
  matches: CvExtractionMatches | null = null,
): CvExtractionSelection {
  return {
    contact: CV_CONTACT_FIELDS.filter((field) => hasCvText(extraction.contact?.[field])),
    presentation: hasCvText(extraction.presentation?.aboutMe) ? [CV_PRESENTATION_INDEX] : [],
    education: toPendingIndexes(extraction.educations, matches?.education),
    experience: toPendingIndexes(extraction.workExperiences, matches?.experience),
    skills: toIndexes(extraction.skills),
  };
}
