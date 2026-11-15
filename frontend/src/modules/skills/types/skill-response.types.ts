import type { SkillOrigin } from "./skill-item.types";

export interface SkillResponse {
  id: string;
  name: string;
  isCustom: boolean;
  origin?: SkillOrigin;
  linkedExperienceCount?: number;
  isRemovable?: boolean;
}
