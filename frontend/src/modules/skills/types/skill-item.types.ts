import type { SkillOrigin } from "./skill-origin.types";

export interface SkillItem {
  id: string;
  name: string;
  areaId?: string | null;
  radarPoints?: number;
  radarHighRelevancePoints?: number;
  category?: string;
  origins?: SkillOrigin[];
}