import type { DetectedSkill } from "./detected-skill.types";

export interface SkillsAnalysisResult {
  experienceId: string;
  skills: DetectedSkill[];
  processingTimeMs: number;
}
