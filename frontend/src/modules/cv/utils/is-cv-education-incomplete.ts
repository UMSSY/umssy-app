import type { CvExtractedEducation } from "../types/cv-extracted-education.types";
import { hasCvText } from "./has-cv-text";

export function isCvEducationIncomplete(education: CvExtractedEducation): boolean {
  return [education.institution, education.degree, education.startDate, education.endDate].some(
    (value) => !hasCvText(value),
  );
}
