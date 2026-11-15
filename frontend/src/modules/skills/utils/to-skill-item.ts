import type { SkillItem } from "../types/skill-item.types";
import type { SkillResponse } from "../types/skill-response.types";

export function toSkillItem(skill: SkillResponse): SkillItem {
  const item: SkillItem = { id: skill.id, name: skill.name };

  if (skill.origin !== undefined) item.origin = skill.origin;
  if (skill.linkedExperienceCount !== undefined) {
    item.linkedExperienceCount = skill.linkedExperienceCount;
  }
  if (skill.isRemovable !== undefined) item.isRemovable = skill.isRemovable;

  return item;
}
