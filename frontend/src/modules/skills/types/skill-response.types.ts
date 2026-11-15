export interface SkillResponse {
  id: string;
  name: string;
  isCustom: boolean;
  source?: string;
  evidenceRefs?: string[];
}