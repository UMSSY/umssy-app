import type { SkillOrigin } from "./skill-origin.types";

export interface SkillItem {
  id: string;
  name: string;
  category?: string;
  origins?: SkillOrigin[];
}