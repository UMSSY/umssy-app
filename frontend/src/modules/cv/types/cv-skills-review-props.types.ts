import type { CvExtractedSkill } from "./cv-extracted-skill.types";

export interface CvSkillsReviewProps {
  skills?: readonly CvExtractedSkill[];
  selected?: readonly number[];
  onToggle: (index: number) => void;
}
