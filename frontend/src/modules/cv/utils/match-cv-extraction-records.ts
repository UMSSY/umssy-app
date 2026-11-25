import type { CvEducationNamesResolver } from "../types/cv-education-names-resolver.types";
import type { CvExistingRecords } from "../types/cv-existing-records.types";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionMatches } from "../types/cv-extraction-matches.types";
import { matchCvRecords } from "./match-cv-records";
import { mergeCvEducation } from "./merge-cv-education";
import { mergeCvWorkExperience } from "./merge-cv-work-experience";
import { toCvMatchKey } from "./to-cv-match-key";

const keepNames: CvEducationNamesResolver = (names) => names;

const toComparableText = (value: string | null | undefined): string => (value ?? "").trim();

export function matchCvExtractionRecords(
  extraction: CvExtraction,
  existing: CvExistingRecords,
  resolveEducationNames: CvEducationNamesResolver = keepNames,
): CvExtractionMatches {
  const toEducationKey = (institution: string | null, degree: string | null) => {
    const names = resolveEducationNames({ institution: institution ?? "", degree: degree ?? "" });
    return toCvMatchKey(names.institution, names.degree);
  };

  return {
    education: matchCvRecords(extraction.educations, existing.educations, {
      toExtractedKey: (education) => toEducationKey(education.institution, education.degree),
      toRecordKey: (record) => toEducationKey(record.institution, record.degree),
      getExtractedStartDate: (education) => education.startDate,
      isChanged: (education, record) => {
        const merged = mergeCvEducation(education, record);
        return (
          merged.startDate !== record.startDate ||
          (merged.endDate ?? null) !== record.endDate ||
          toComparableText(merged.description) !== toComparableText(record.description)
        );
      },
    }),
    experience: matchCvRecords(extraction.workExperiences, existing.workExperiences, {
      toExtractedKey: (experience) => toCvMatchKey(experience.companyName, experience.position),
      toRecordKey: (record) => toCvMatchKey(record.companyName, record.position),
      getExtractedStartDate: (experience) => experience.startDate,
      isChanged: (experience, record) => {
        const merged = mergeCvWorkExperience(experience, record);
        return (
          merged.startDate !== record.startDate ||
          merged.endDate !== record.endDate ||
          merged.isCurrent !== record.isCurrent ||
          toComparableText(merged.description) !== toComparableText(record.description)
        );
      },
    }),
  };
}
