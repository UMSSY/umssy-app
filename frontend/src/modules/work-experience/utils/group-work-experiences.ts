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
      .replace(/\s+/g, " ")
      .toLowerCase();

    const groupId = normalizedCompanyName
      ? `company:${normalizedCompanyName}`
      : `experience:${experience.id}`;

    const existingGroup = groups.get(groupId);

    if (existingGroup) {
      existingGroup.positions.push(experience);
      continue;
    }

    groups.set(groupId, {
      id: groupId,
      companyName: experience.companyName.trim(),
      positions: [experience],
    });
  }

  return Array.from(groups.values());
}
