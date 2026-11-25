import type { CvExistingWorkExperience } from "../types/cv-existing-work-experience.types";
import type { CvExtractedWorkExperience } from "../types/cv-extracted-work-experience.types";
import type { CvWorkExperienceUpdate } from "../types/cv-work-experience-update.types";
import { hasCvText } from "./has-cv-text";

export function mergeCvWorkExperience(
  experience: CvExtractedWorkExperience,
  record: CvExistingWorkExperience,
): CvWorkExperienceUpdate {
  const hasEndInformation = experience.isCurrent || hasCvText(experience.endDate);
  const isCurrent = hasEndInformation ? experience.isCurrent : record.isCurrent;
  return {
    companyName: record.companyName,
    position: record.position,
    startDate: hasCvText(experience.startDate) ? experience.startDate : record.startDate,
    endDate: isCurrent ? null : hasEndInformation ? experience.endDate : record.endDate,
    isCurrent,
    description: hasCvText(experience.description) ? experience.description.trim() : record.description,
  };
}
