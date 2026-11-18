import type { CvExtractedWorkExperience } from "../types/cv-extracted-work-experience.types";
import { hasCvText } from "./has-cv-text";

export function isCvWorkExperienceIncomplete(experience: CvExtractedWorkExperience): boolean {
  const hasEnd = experience.isCurrent || hasCvText(experience.endDate);
  return (
    !hasEnd ||
    [experience.companyName, experience.position, experience.startDate, experience.description].some(
      (value) => !hasCvText(value),
    )
  );
}
