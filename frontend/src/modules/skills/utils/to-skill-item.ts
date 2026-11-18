import type { SkillItem } from "../types/skill-item.types";
import type { SkillResponse } from "../types/skill-response.types";

export function toSkillItem(skill: SkillResponse): SkillItem {
  return skill.origins
    ? { id: skill.id, name: skill.name, origins: skill.origins }
    : { id: skill.id, name: skill.name };
}
