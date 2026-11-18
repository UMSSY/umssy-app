export interface ProfileSkillRowResponse {
  id: string;
  skillId: string;
  source: string;
  verificationStatus: string;
  radarAutoVerified?: boolean;
  isHighRelevance: boolean;
  evidenceRefs: unknown;
  skill: {
    name: string;
    areaId: string | null;
  };
}
