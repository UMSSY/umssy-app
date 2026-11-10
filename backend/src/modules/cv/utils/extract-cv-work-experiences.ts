import {
  CV_COMPANY_KEYWORDS,
  CV_FIELD_MAX_LENGTHS,
} from '../constants/cv-extraction.constants.js';
import type { CvExtractedWorkExperienceResponse } from '../responses/cv-extracted-work-experience.response.js';
import type { CvTextEntry } from '../types/cv-text-entry.type.js';
import { includesCvKeyword } from './includes-cv-keyword.js';
import { truncateCvText } from './truncate-cv-text.js';

function findCompanyIndex(parts: readonly string[]): number {
  const byKeyword = parts.findIndex((part) =>
    includesCvKeyword(part, CV_COMPANY_KEYWORDS),
  );
  if (byKeyword !== -1) return byKeyword;
  return parts.length > 1 ? 1 : -1;
}

function toWorkExperience(
  entry: CvTextEntry,
): CvExtractedWorkExperienceResponse {
  const parts = entry.headerParts;
  const companyIndex = findCompanyIndex(parts);
  const position = parts.find((_, index) => index !== companyIndex);
  return {
    companyName: truncateCvText(
      parts[companyIndex],
      CV_FIELD_MAX_LENGTHS.companyName,
    ),
    position: truncateCvText(position, CV_FIELD_MAX_LENGTHS.position),
    startDate: entry.dateRange?.startDate ?? null,
    endDate: entry.dateRange?.endDate ?? null,
    isCurrent: entry.dateRange?.isCurrent ?? false,
    description: truncateCvText(
      entry.bodyLines.join('\n'),
      CV_FIELD_MAX_LENGTHS.workExperienceDescription,
    ),
  };
}

export function extractCvWorkExperiences(
  entries: readonly CvTextEntry[],
): CvExtractedWorkExperienceResponse[] {
  return entries
    .map(toWorkExperience)
    .filter((experience) => experience.companyName || experience.position);
}
