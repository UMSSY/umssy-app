export interface SkillResponse {
  id: string;
  name: string;
  areaId?: string | null;
  radarPoints?: number;
  radarHighRelevancePoints?: number;
  isCustom: boolean;
}
