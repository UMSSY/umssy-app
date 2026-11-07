import type { DetectedSkill } from "@/modules/matching";

export interface WorkExperienceSkillsPreviewOptions {
  experienceId?: string;
  description: string;
  initialSkills?: DetectedSkill[];
}
