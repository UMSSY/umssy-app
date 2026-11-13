import { resolveEducationDegree } from '../../educations/utils/resolve-education-degree.js';
import { resolveEducationInstitution } from '../../educations/utils/resolve-education-institution.js';
import {
  CV_DEGREE_KEYWORDS,
  CV_FIELD_MAX_LENGTHS,
  CV_INSTITUTION_KEYWORDS,
} from '../constants/cv-extraction.constants.js';
import type { CvExtractedEducationResponse } from '../responses/cv-extracted-education.response.js';
import type { CvTextEntry } from '../types/cv-text-entry.type.js';
import { includesCvKeyword } from './includes-cv-keyword.js';
import { truncateCvText } from './truncate-cv-text.js';

function findInstitutionIndex(parts: readonly string[]): number {
  const resolved = parts.findIndex(
    (part) => resolveEducationInstitution(part) !== undefined,
  );
  if (resolved !== -1) return resolved;
  const byKeyword = parts.findIndex((part) =>
    includesCvKeyword(part, CV_INSTITUTION_KEYWORDS),
  );
  if (byKeyword !== -1) return byKeyword;
  return parts.length > 1 ? 1 : -1;
}

function toEducation(entry: CvTextEntry): CvExtractedEducationResponse {
  const parts = entry.headerParts;
  const institutionIndex = findInstitutionIndex(parts);
  const rawInstitution = parts[institutionIndex];
  const institution = rawInstitution
    ? (resolveEducationInstitution(rawInstitution) ?? rawInstitution)
    : null;
  const remaining = parts.filter((_, index) => index !== institutionIndex);
  const rawDegree =
    remaining.find((part) => includesCvKeyword(part, CV_DEGREE_KEYWORDS)) ??
    remaining[0];
  const degree =
    rawDegree && institution
      ? (resolveEducationDegree(institution, rawDegree) ?? rawDegree)
      : rawDegree;
  return {
    institution: truncateCvText(institution, CV_FIELD_MAX_LENGTHS.institution),
    degree: truncateCvText(degree, CV_FIELD_MAX_LENGTHS.degree),
    startDate: entry.dateRange?.startDate ?? null,
    endDate: entry.dateRange?.endDate ?? null,
    description: truncateCvText(
      entry.bodyLines.join('\n'),
      CV_FIELD_MAX_LENGTHS.educationDescription,
    ),
  };
}

export function extractCvEducations(
  entries: readonly CvTextEntry[],
): CvExtractedEducationResponse[] {
  return entries
    .map(toEducation)
    .filter((education) => education.institution || education.degree);
}
