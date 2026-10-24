export interface ProfileSkillRow {
  id: string;
  skillId: string;
  source: string;
  verificationStatus: string;
  isHighRelevance: boolean;
  evidenceRefs: unknown;
  skill: {
    name: string;
    areaId: string | null;
  };
}
