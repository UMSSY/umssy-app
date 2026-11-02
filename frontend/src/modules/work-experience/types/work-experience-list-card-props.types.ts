
import type { SkillsAnalysisResult } from "@/modules/matching";
import type { WorkExperienceItem } from "./work-experience-item.types";

export interface WorkExperienceListCardProps {
  experiences?: WorkExperienceItem[];
  isLoading?: boolean;
  isBusy?: boolean;
  onAdd?: () => void;
  onEdit?: (experience: WorkExperienceItem) => void;
  onDelete?: (experience: WorkExperienceItem) => void;
  skillsByExperience?: Record<string, string[]>;
  analysis?: SkillsAnalysisResult | null;
}
