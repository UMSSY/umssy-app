import type { CvEducationUpdate } from "../types/cv-education-update.types";
import type { CvExistingEducation } from "../types/cv-existing-education.types";
import type { CvExtractedEducation } from "../types/cv-extracted-education.types";
import { hasCvText } from "./has-cv-text";

export function mergeCvEducation(education: CvExtractedEducation, record: CvExistingEducation): CvEducationUpdate {
  const endDate = hasCvText(education.endDate) ? education.endDate : record.endDate;
  return {
    institution: record.institution,
    degree: record.degree,
    startDate: hasCvText(education.startDate) ? education.startDate : record.startDate,
    ...(endDate ? { endDate } : {}),
    description: hasCvText(education.description) ? education.description.trim() : record.description,
  };
}
