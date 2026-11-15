import type { USER_SKILL_ORIGINS } from '../constants/user-skill.constants.js';

export type UserSkillOrigin =
  (typeof USER_SKILL_ORIGINS)[keyof typeof USER_SKILL_ORIGINS];

export interface SkillOriginSummary {
  origin: UserSkillOrigin;
  linkedExperienceCount: number;
  isRemovable: boolean;
}
