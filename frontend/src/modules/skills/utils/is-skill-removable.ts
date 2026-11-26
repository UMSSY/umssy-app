import type { SkillItem } from "../types/skill-item.types";

export function isSkillRemovable({ origins }: SkillItem): boolean {
  if (!origins) return true;

  return origins.includes("manual") && !origins.includes("experience") && !origins.includes("cv");
}
