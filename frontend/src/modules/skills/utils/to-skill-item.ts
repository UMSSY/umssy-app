import type { SkillItem } from "../types/skill-item.types";
import type { SkillResponse } from "../types/skill-response.types";

export function toSkillItem(skill: SkillResponse): SkillItem {
  return {
    id: skill.id,
    name: skill.name,
    ...(skill.origins && { origins: skill.origins }),
    ...(skill.areaId !== undefined && { areaId: skill.areaId }),
    ...(skill.radarPoints !== undefined && { radarPoints: skill.radarPoints }),
    ...(skill.radarHighRelevancePoints !== undefined && {
      radarHighRelevancePoints: skill.radarHighRelevancePoints,
    }),
  };
}
