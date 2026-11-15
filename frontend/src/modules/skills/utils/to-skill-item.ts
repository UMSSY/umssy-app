import type { SkillItem } from "../types/skill-item.types";
import type { SkillResponse } from "../types/skill-response.types";

export function toSkillItem(skill: SkillResponse): SkillItem {
  const hasExperienceEvidence = (skill.evidenceRefs ?? []).some(
    (ref) => ref.startsWith("work_experience:"),
  );

  return {
    id: skill.id,
    name: skill.name,
    canRemove: skill.source === "manual" && !hasExperienceEvidence,
  };
}
