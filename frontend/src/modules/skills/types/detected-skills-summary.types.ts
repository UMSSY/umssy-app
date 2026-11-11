import type { DetectedSkill } from "./detected-skill.types";
import type { SkillsRadarStatus } from "./skills-radar-status.types";

export interface DetectedSkillsSummary {
  status: SkillsRadarStatus;
  skills: DetectedSkill[];
}
