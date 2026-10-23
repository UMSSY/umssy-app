import type { WorkExperienceItem } from "../types/work-experience-item.types";
import type { WorkExperienceCompanyGroup } from "../types/work-experience-company-group.types";
import { sortWorkExperiences } from "./sort-work-experiences";

export function groupWorkExperiences(experiences: WorkExperienceItem[]): WorkExperienceCompanyGroup[] {
  const groups: WorkExperienceCompanyGroup[] = [];
  for (const experience of sortWorkExperiences(experiences)) {
    const group = groups.at(-1);
    const newerPosition = group?.positions.at(-1);
    const lastContinuousDate = experience.endDate ? new Date(`${experience.endDate}T12:00:00Z`) : null;
    if (lastContinuousDate) lastContinuousDate.setUTCMonth(lastContinuousDate.getUTCMonth() + 1);
    const hasContinuousDates = newerPosition && lastContinuousDate && new Date(`${newerPosition.startDate}T12:00:00Z`) <= lastContinuousDate;
    if (group && group.companyName.trim().toLowerCase() === experience.companyName.trim().toLowerCase() && hasContinuousDates) group.positions.push(experience);
    else groups.push({ companyName: experience.companyName, positions: [experience] });
  }
  return groups;
}
