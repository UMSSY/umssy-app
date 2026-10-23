import type { SkillItem } from "./skill-item.types";

export interface SkillsProfileResponse {
  catalog: SkillItem[];
  selected: SkillItem[];
}
