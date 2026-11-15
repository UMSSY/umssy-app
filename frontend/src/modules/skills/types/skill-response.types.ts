import type { SkillOrigin } from "./skill-origin.types";

export interface SkillResponse {
  id: string;
  name: string;
  isCustom: boolean;
  origins?: SkillOrigin[];
}
