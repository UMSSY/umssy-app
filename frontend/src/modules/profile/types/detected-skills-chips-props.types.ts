export interface DetectedSkillItem {
  id: string;
  name: string;
}

export interface DetectedSkillsChipsProps {
  skills?: DetectedSkillItem[];
  processingTimeMs?: number;
  isLoading?: boolean;
}
