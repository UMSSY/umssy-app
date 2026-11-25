"use client";

import { useEducations } from "@/modules/educations";
import { useWorkExperiences } from "@/modules/work-experience";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionMatches } from "../types/cv-extraction-matches.types";
import { matchCvExtractionRecords } from "../utils/match-cv-extraction-records";
import { useCvEducationNamesResolver } from "./use-cv-education-names-resolver";

export function useCvRecordMatcher(): (extraction: CvExtraction) => CvExtractionMatches {
  const { experiences } = useWorkExperiences();
  const { educations } = useEducations();
  const resolveEducationNames = useCvEducationNamesResolver();
  return (extraction) =>
    matchCvExtractionRecords(extraction, { workExperiences: experiences, educations }, resolveEducationNames);
}
