import type { SkillItem } from "../types/skill-item.types";

export function getSkillOriginHint(skill: SkillItem): string | undefined {
  if (skill.isRemovable !== false) return undefined;

  const count = skill.linkedExperienceCount ?? 0;
  if (count === 1) return "Respaldada por 1 experiencia laboral";
  if (count > 1) return `Respaldada por ${count} experiencias laborales`;
  return "Respaldada por otra fuente de tu perfil";
}
