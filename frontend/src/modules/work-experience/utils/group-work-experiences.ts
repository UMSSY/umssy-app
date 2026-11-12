import type { WorkExperienceItem } from "../types/work-experience-item.types";
import type { WorkExperienceCompanyGroup } from "../types/work-experience-company-group.types";
import { sortWorkExperiences } from "./sort-work-experiences";

export function groupWorkExperiences(
  experiences: WorkExperienceItem[],
): WorkExperienceCompanyGroup[] {
  const groups = new Map<string, WorkExperienceCompanyGroup>();

  for (const experience of sortWorkExperiences(experiences)) {
    const normalizedCompanyName = experience.companyName
      .trim()
      .toLowerCase();

    const groupKey = normalizedCompanyName
      ? normalizedCompanyName
      : `__experience__:${experience.id}`;

    const existingGroup = groups.get(groupKey);

    if (existingGroup) {
      existingGroup.positions.push(experience);
      continue;
    }

    groups.set(groupKey, {
      companyName: experience.companyName.trim(),
      positions: [experience],
    });
  }

  return Array.from(groups.values());
}
