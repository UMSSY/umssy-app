import type { SkillItem } from "../types/skill-item.types";

export function isManualSkill({ origins }: SkillItem): boolean {
  return !origins || origins.includes("manual");
}
