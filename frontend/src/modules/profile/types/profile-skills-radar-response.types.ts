export interface ProfileSkillEvidenceRef {
  type: "work-experience" | "education";
  id: string;
}

export interface ProfileSkillRadarItem {
  id: string;
  text: string;
  name: string;
  source: "manual" | "nlp";
  areaId: string | null;
  verificationStatus: string;
  isHighRelevance: boolean;
  evidenceRefs: ProfileSkillEvidenceRef[];
}

export interface ProfileSkillsRadarResponse {
  userId: string;
  status: string;
  version: number;
  updatedAt: string | null;
  dictionaryVersion: string | null;
  skills: ProfileSkillRadarItem[];
}