import type { SkillsRadarStatus } from "./skills-radar-status.types";

export interface SkillsRadarResponse {
  userId: string;
  status: SkillsRadarStatus;
  version: number;
  updatedAt: string | null;
  dictionaryVersion: string | null;
  skills: {
    id: string;
    name: string;
    source: "manual" | "nlp";
    areaId: string | null;
    verificationStatus: string;
    isHighRelevance: boolean;
    evidenceRefs: { type: string; id: string }[];
  }[];
}
